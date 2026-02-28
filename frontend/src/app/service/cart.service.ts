import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CartItemVariant {
  _id: string;
  sku?: string;
  attributes?: { name: string; value: string }[];
  currentPrice: number;
  stock: number;
  reservedStock: number;
  availableStock: number;
  imageUrl?: string | null;
}

export interface CartItemProduct {
  _id: string;
  name: string;
  slug?: string;
}

export interface CartItemShop {
  _id: string;
  name: string;
  logo?: string | null;
}

export interface CartItem {
  productVariantId: string;
  quantity: number;
  variant: CartItemVariant;
  product: CartItemProduct;
  shop: CartItemShop;
  subtotal: number;
}

export interface CartResponse {
  _id: string | null;
  items: CartItem[];
  totalItems: number;
}

export interface CartActionResponse {
  message: string;
  cart: CartResponse;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private API_URI = `${environment.apiUrl}/cart`;
  private count$ = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {}

  get cartCount$(): Observable<number> {
    return this.count$.asObservable();
  }

  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(this.API_URI).pipe(
      tap((res) => this.count$.next(res?.totalItems ?? 0))
    );
  }

  getCartCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.API_URI}/count`).pipe(
      tap((res) => this.count$.next(res?.count ?? 0))
    );
  }

  refreshCount(): void {
    this.getCartCount().subscribe({
      next: () => {},
      error: () => this.count$.next(0)
    });
  }

  addItem(productVariantId: string, quantity: number): Observable<CartActionResponse> {
    return this.http
      .post<CartActionResponse>(`${this.API_URI}/items`, { productVariantId, quantity })
      .pipe(tap((res) => this.count$.next(res?.cart?.totalItems ?? 0)));
  }

  updateItemQuantity(variantId: string, quantity: number): Observable<CartActionResponse> {
    return this.http
      .put<CartActionResponse>(`${this.API_URI}/items/${variantId}`, { quantity })
      .pipe(tap((res) => this.count$.next(res?.cart?.totalItems ?? 0)));
  }

  removeItem(variantId: string): Observable<CartActionResponse> {
    return this.http
      .delete<CartActionResponse>(`${this.API_URI}/items/${variantId}`)
      .pipe(tap((res) => this.count$.next(res?.cart?.totalItems ?? 0)));
  }

  clearCart(): Observable<CartActionResponse> {
    return this.http.delete<CartActionResponse>(this.API_URI).pipe(
      tap((res) => this.count$.next(res?.cart?.totalItems ?? 0))
    );
  }
}
