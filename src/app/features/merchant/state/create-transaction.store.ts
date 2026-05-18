import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductService } from '../services/product.service';
import { Product } from '@shared/models/product.model';
import { CartItem } from '@shared/models/transaction.model';
import { finalize } from 'rxjs';

interface CreateTransactionState {
  products: Product[];
  cart: CartItem[];
  loading: boolean;
  searchQuery: string;
}

export interface GroupedProducts {
  categoryName: string;
  products: Product[];
}

@Injectable({ providedIn: 'root' })
export class CreateTransactionStore {
  private productService = inject(ProductService);
  private destroyRef = inject(DestroyRef);

  private state = signal<CreateTransactionState>({
    products: [],
    cart: [],
    loading: false,
    searchQuery: ''
  });
  
  products = computed(() => this.state().products);
  cart = computed(() => this.state().cart);
  loading = computed(() => this.state().loading);
  searchQuery = computed(() => this.state().searchQuery);

  totalAmount = computed(() => 
    this.state().cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  );

  groupedProducts = computed(() => {
    const query = this.state().searchQuery.toLowerCase();
    const allProducts = this.state().products;
    
    // 1. Filter by search (name or category)
    const filtered = allProducts.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.category?.name.toLowerCase().includes(query)
    );

    // 2. Group by category
    const groups: { [key: string]: Product[] } = {};

    filtered.forEach(p => {
      const catName = p.category?.name || 'Others';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(p);
    });

    // 3. Convert to array of groups and sort (Others at bottom)
    return Object.keys(groups)
      .sort((a, b) => {
        if (a === 'Others') return 1;
        if (b === 'Others') return -1;
        return a.localeCompare(b);
      })
      .map(key => ({
        categoryName: key,
        products: groups[key]
      } as GroupedProducts));
    });


  // --- ACTIONS ---
  loadProducts() {
    this.patchState({ loading: true });
    // Fetch products (limit to 100 for POS listing)
    this.productService.getAll(0, 100)
      .pipe(
        finalize(() => this.patchState({ loading: false })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(r => {
        this.patchState({ products: r.data ?? [] });
      });
  }

  setSearchQuery(query: string) {
    this.patchState({ searchQuery: query });
  }

  addToCart(product: Product) {
    if (!product.isActive || product.stock === 0) return;
    
    const currentCart = [...this.state().cart];
    const existing = currentCart.find(i => i.productId === product.id);

    if (existing) {
      const updatedCart = currentCart.map(i => 
        i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
      );
      this.patchState({ cart: updatedCart });
    } else {
      this.patchState({ 
        cart: [...currentCart, { 
          productId: product.id, 
          name: product.name, 
          price: product.price, 
          quantity: 1, 
          imageUrl: product.imageUrl 
        }] 
      });
    }
  }

  updateQty(productId: string, qty: number) {
    if (qty <= 0) {
      this.patchState({ cart: this.state().cart.filter(i => i.productId !== productId) });
      return;
    }
    
    const updatedCart = this.state().cart.map(i => 
      i.productId === productId ? { ...i, quantity: qty } : i
    );
    this.patchState({ cart: updatedCart });
  }

  clearCart() {
    this.patchState({ cart: [] });
  }

  private patchState(partial: Partial<CreateTransactionState>) {
    this.state.update(s => ({ ...s, ...partial }));
  }
}
