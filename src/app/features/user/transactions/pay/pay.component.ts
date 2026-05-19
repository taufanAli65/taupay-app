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
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';
import jsQR from 'jsqr';

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue?: string }>>;
};

@Component({
  selector: 'app-user-pay',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, QRCodeModule, IconComponent, CurrencyIdrPipe],
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
  @ViewChild('scanCanvas') scanCanvas?: ElementRef<HTMLCanvasElement>;
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

  transactionDetail = signal<{ trxId: string; merchantId?: string; total?: number; products?: any[] } | null>(null);

  payForm = this.fb.group({
    trxId: ['', Validators.required],
    pin: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  private sseSub?: Subscription;
  private redirectTimer?: ReturnType<typeof setTimeout>;
  private mediaStream?: MediaStream;
  private scanTimer?: any;

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
    this.cameraSupported.set(Boolean(navigator.mediaDevices?.getUserMedia));
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
      
      this.startCameraScanLoop();
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
      cancelAnimationFrame(this.scanTimer);
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

      this.processDetectedTrx(trxId);
    } finally {
      this.qrLoading.set(false);
    }
  }

  processDetectedTrx(trxId: string): void {
    if (!trxId?.trim()) return;
    this.qrLoading.set(true);
    this.userTransactionService.getTransactionDetail(trxId.trim()).subscribe({
      next: (res) => {
        const data = res.data;
        if (data.status !== 'PENDING') {
          this.toast.show(`Transaction is already ${data.status.toLowerCase()}`, 'warning');
          this.qrLoading.set(false);
          this.resetFlow();
          return;
        }

        this.payForm.patchValue({ trxId: trxId.trim() });
        this.trxId.set(trxId.trim());
        this.transactionDetail.set({
          trxId: trxId.trim(),
          merchantId: data.merchant_id,
          total: data.total || 0,
          products: data.products || []
        });
        this.step.set('confirm');
        this.qrLoading.set(false);
        this.toast.show('Transaction loaded.', 'success');
      },
      error: () => {
        this.qrLoading.set(false);
        this.toast.show('Invalid Transaction ID or server error.', 'danger');
        this.scanError.set('Transaction not found. Please check the ID.');
      }
    });
  }

  private startCameraScanLoop(): void {
    const scan = () => {
      if (!this.cameraActive() || this.paying()) {
        return;
      }

      const video = this.cameraVideo?.nativeElement;
      const canvas = this.scanCanvas?.nativeElement;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            this.stopCamera();
            this.processDetectedTrx(code.data);
            return;
          }
        }
      }
      this.scanTimer = requestAnimationFrame(scan);
    };
    this.scanTimer = requestAnimationFrame(scan);
  }

  private async decodeQrFromFile(file: File): Promise<string | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) return resolve(null);

          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          resolve(code ? code.data : null);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
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
      pin: pinValue,
      status: 'PAID'
    } as any).subscribe({
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
        this.step.set('pin');
        this.focusPinInput();
      }
    });

    if (trxIdValue) {
      this.sseSub = this.userTransactionService.subscribeToStatus(trxIdValue).subscribe({
        next: (event: TransactionStatusEvent) => {
          if (event.status === 'PAID') {
            this.status.set('paid');
          } else if (event.status === 'FAILED') {
            this.status.set('failed');
          }
        },
        error: () => {}
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

  goBack(): void {
    this.resetFlow();
    void this.router.navigate(['/user/transactions/history']);
  }
}
