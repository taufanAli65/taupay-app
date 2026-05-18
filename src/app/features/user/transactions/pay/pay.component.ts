import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, OnDestroy, OnInit, PLATFORM_ID, signal, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserTransactionService } from '@features/user/services/user-transaction.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { TransactionStatusEvent } from '@shared/models/transaction.model';
import { Subscription } from 'rxjs';
import { QRCodeModule } from 'angularx-qrcode';
import { IconComponent } from '@shared/components/icon/icon.component';

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue?: string }>>;
};

@Component({
  selector: 'app-user-pay',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, QRCodeModule, IconComponent],
  templateUrl: './pay.component.html'
})
export class UserPayComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private userTransactionService = inject(UserTransactionService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('qrFileInput') qrFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('cameraVideo') cameraVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('pinInput') pinInput?: ElementRef<HTMLInputElement>;
  status = signal<'idle' | 'waiting' | 'paid' | 'failed'>('idle');
  paying = signal(false);
  trxId = signal('');
  qrLoading = signal(false);
  cameraActive = signal(false);
  cameraStarting = signal(false);
  cameraSupported = signal(true);
  scanError = signal('');
  selectedFileName = signal('');

  // Multi-step flow: 'scan' -> 'confirm' -> 'pin' -> 'result'
  step = signal<'scan' | 'confirm' | 'pin' | 'result'>('scan');

  transactionDetail = signal<{ trxId: string; merchantName?: string; total?: number } | null>(null);

  payForm = this.fb.group({
    trxId: ['', Validators.required],
    pin: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  private sseSub?: Subscription;
  private redirectTimer?: ReturnType<typeof setTimeout>;
  private mediaStream?: MediaStream;
  private scanTimer?: ReturnType<typeof setInterval>;

  get statusLabel(): string {
    return {
      idle: 'Ready to Pay',
      waiting: 'Processing...',
      paid: 'Payment Successful!',
      failed: 'Payment Failed'
    }[this.status()];
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const detectorCtor = this.getBarcodeDetectorCtor();
    this.cameraSupported.set(Boolean(navigator.mediaDevices?.getUserMedia));
    if (!detectorCtor) {
      this.scanError.set('This browser cannot scan QR codes directly. You can still open the camera or upload an image.');
    }
  }

  triggerQrUpload(): void {
    this.qrFileInput?.nativeElement.click();
  }

  focusPinInput(): void {
    queueMicrotask(() => {
      this.pinInput?.nativeElement.focus();
      this.pinInput?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  async openCamera(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      this.cameraSupported.set(false);
      this.scanError.set('Camera scan is not supported in this browser. Use image upload instead.');
      return;
    }

    this.scanError.set('');
    this.cameraStarting.set(true);

    try {
      this.stopCamera();
      this.cameraActive.set(true);
      this.cdr.detectChanges();

      const video = this.cameraVideo?.nativeElement;
      if (!video) {
        this.scanError.set('Camera preview is unavailable.');
        this.stopCamera();
        return;
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });

      video.srcObject = this.mediaStream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      const detectorCtor = this.getBarcodeDetectorCtor();
      if (detectorCtor) {
        this.startCameraScanLoop(detectorCtor);
      } else {
        this.scanError.set('Camera preview is open. If your browser cannot scan QR directly, upload a QR image instead.');
      }
      this.toast.show('Camera opened. Point it at the merchant QRIS code.', 'success');
    } catch {
      this.scanError.set('Unable to open the camera. Check browser permissions or upload an image instead.');
      this.stopCamera();
    } finally {
      this.cameraStarting.set(false);
    }
  }

  stopCamera(): void {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = undefined;
    }

    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.stop();
      }
      this.mediaStream = undefined;
    }

    const video = this.cameraVideo?.nativeElement;
    if (video) {
      video.pause();
      video.srcObject = null;
    }

    this.cameraActive.set(false);
  }

  async onQrFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    this.selectedFileName.set(file.name);
    this.scanError.set('');
    this.qrLoading.set(true);

    try {
      this.stopCamera();
      const trxId = await this.decodeQrFromFile(file);
      if (!trxId) {
        this.scanError.set('Could not read a QR code from that image.');
        this.toast.show('Could not read a QR code from that image.', 'warning');
        return;
      }

      this.payForm.patchValue({ trxId });
      this.trxId.set(trxId);
      this.status.set('idle');
      this.transactionDetail.set({ trxId });
      this.step.set('confirm');
      this.toast.show('Transaction QR loaded. Confirm details to continue.', 'success');
    } finally {
      this.qrLoading.set(false);
    }
  }

  private startCameraScanLoop(detectorCtor: BarcodeDetectorCtor): void {
    const detector = new detectorCtor({ formats: ['qr_code'] });
    this.scanTimer = setInterval(async () => {
      if (!this.cameraActive() || this.paying()) {
        return;
      }

      const video = this.cameraVideo?.nativeElement;
      if (!video || video.readyState < 2) {
        return;
      }

      try {
        const codes = await detector.detect(video);
        const trxId = codes[0]?.rawValue?.trim();
        if (!trxId) {
          return;
        }

        this.payForm.patchValue({ trxId });
        this.trxId.set(trxId);
        this.status.set('idle');
        this.selectedFileName.set('');
        this.scanError.set('');
        this.transactionDetail.set({ trxId });
        this.step.set('confirm');
        this.toast.show('QRIS code detected. Confirm details to continue.', 'success');
        this.stopCamera();
      } catch {
        // Ignore frame-level detection failures and keep scanning.
      }
    }, 500);
  }

  private getBarcodeDetectorCtor(): BarcodeDetectorCtor | undefined {
    return (globalThis as unknown as Window & {
      BarcodeDetector?: new (options?: { formats?: string[] }) => {
        detect(source: ImageBitmapSource): Promise<Array<{ rawValue?: string }>>;
      };
    }).BarcodeDetector;
  }

  private async decodeQrFromFile(file: File): Promise<string | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const detectorCtor = this.getBarcodeDetectorCtor();

    if (!detectorCtor || typeof createImageBitmap === 'undefined') {
      return null;
    }

    const detector = new detectorCtor({ formats: ['qr_code'] });
    const bitmap = await createImageBitmap(file);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;

      const context = canvas.getContext('2d');
      if (!context) {
        return null;
      }

      context.drawImage(bitmap, 0, 0);
      const codes = await detector.detect(canvas);
      return codes[0]?.rawValue?.trim() ?? null;
    } finally {
      bitmap.close();
    }
  }

  onSubmit(): void {
    if (this.payForm.invalid) {
      this.payForm.markAllAsTouched();
      return;
    }

    this.paying.set(true);
    const formValue = this.payForm.getRawValue();
    const trxIdValue = formValue.trxId ?? '';
    const pinValue = formValue.pin ?? '';

    this.trxId.set(trxIdValue);
    this.status.set('waiting');

    this.userTransactionService.sendCallback({
      trx_id: trxIdValue,
      pin: pinValue
    }).subscribe({
      next: () => {
        this.status.set('paid');
        this.toast.show('Payment successful!', 'success');
        this.paying.set(false);
        this.step.set('result');
        this.redirectTimer = setTimeout(() => {
          void this.router.navigate(['/user/transactions/history']);
        }, 1500);
      },
      error: () => {
        this.status.set('idle');
        this.paying.set(false);
        // Error toast is handled by global errorInterceptor
        this.step.set('pin');
        this.focusPinInput();
      }
    });

    // Optionally subscribe to SSE for live confirmation
    if (trxIdValue) {
      this.sseSub = this.userTransactionService.subscribeToStatus(trxIdValue).subscribe({
        next: (event: TransactionStatusEvent) => {
          if (event.status === 'PAID') {
            this.status.set('paid');
          } else if (event.status === 'FAILED') {
            this.status.set('failed');
          }
        },
        error: () => {
          // Silently handle SSE errors - the HTTP callback already completed
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.sseSub) {
      this.sseSub.unsubscribe();
    }
    this.stopCamera();
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
  }

  goToPin(): void {
    this.step.set('pin');
    this.focusPinInput();
  }

  resetFlow(): void {
    this.step.set('scan');
    this.payForm.reset();
    this.trxId.set('');
    this.transactionDetail.set(null);
    this.selectedFileName.set('');
    this.scanError.set('');
    this.stopCamera();
  }

  appendPin(digit: string): void {
    const current = this.payForm.get('pin')?.value ?? '';
    if ((current as string).length >= 6) {
      return;
    }
    this.payForm.get('pin')?.setValue((current as string) + digit);
  }

  deletePin(): void {
    const current = this.payForm.get('pin')?.value ?? '';
    this.payForm.get('pin')?.setValue((current as string).slice(0, -1));
  }

  // Public helper for template to reset and navigate
  goBack(): void {
    this.resetFlow();
    void this.router.navigate(['/user/transactions/history']);
  }
}
