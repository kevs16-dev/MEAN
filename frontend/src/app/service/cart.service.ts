import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

/** Variante dans un item du panier (enrichie) */
export interface CartItemVariant {
  _id: string;
  sku?: string;
  attributes?: { name: string; value: string }[];
  currentPrice: number;
  stock: number;
  reservedStock: number;
  availableStock: number;
}

/** Produit dans un item du panier (enrichi) */
export interface CartItemProduct {
  _id: string;
  name: string;
  slug?: string;
}

/** Boutique dans un item du panier (enrichie) */
export interface CartItemShop {
  _id: string;
  name: string;
}

/** Item enrichi du panier */
export interface CartItem {
  productVariantId: string;
  quantity: number;
  variant: CartItemVariant;
  product: CartItemProduct;
  shop: CartItemShop;
  subtotal: number;
}

/** Réponse GET /cart */
export interface CartResponse {
  _id: string | null;
  items: CartItem[];
  totalItems: number;
}

/** Réponse POST /cart/items, PUT, DELETE */
export interface CartActionResponse {
  message: string;
  cart: CartResponse;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private API_URI = `${environment.apiUrl}/cart`;
  private count$ = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {}

  /** Nombre total d'articles (pour badge navbar) */
  get cartCount$(): Observable<number> {
    return this.count$.asObservable();
  }

  /** Récupère le panier du CLIENT */
  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(this.API_URI).pipe(
      tap((res) => this.count$.next(res?.totalItems ?? 0))
    );
  }

  /** Nombre d'articles (GET /cart/count) */
  getCartCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.API_URI}/count`).pipe(
      tap((res) => this.count$.next(res?.count ?? 0))
    );
  }

  /** Recharge le compteur (appeler après login CLIENT) */
  refreshCount(): void {
    this.getCartCount().subscribe({
      next: () => {},
      error: () => this.count$.next(0)
    });
  }

  /** Ajoute une variante au panier (cumul si déjà présente) */
  addItem(productVariantId: string, quantity: number): Observable<CartActionResponse> {
    return this.http
      .post<CartActionResponse>(`${this.API_URI}/items`, { productVariantId, quantity })
      .pipe(tap((res) => this.count$.next(res?.cart?.totalItems ?? 0)));
  }

  /** Modifie la quantité d'une variante dans le panier */
  updateItemQuantity(variantId: string, quantity: number): Observable<CartActionResponse> {
    return this.http
      .put<CartActionResponse>(`${this.API_URI}/items/${variantId}`, { quantity })
      .pipe(tap((res) => this.count$.next(res?.cart?.totalItems ?? 0)));
  }

  /** Supprime une variante du panier */
  removeItem(variantId: string): Observable<CartActionResponse> {
    return this.http
      .delete<CartActionResponse>(`${this.API_URI}/items/${variantId}`)
      .pipe(tap((res) => this.count$.next(res?.cart?.totalItems ?? 0)));
  }

  /** Vide le panier */
  clearCart(): Observable<CartActionResponse> {
    return this.http.delete<CartActionResponse>(this.API_URI).pipe(
      tap((res) => this.count$.next(res?.cart?.totalItems ?? 0))
    );
  }
}
