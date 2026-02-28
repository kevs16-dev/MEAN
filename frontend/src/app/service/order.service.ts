import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Réponse POST /orders/from-cart */
export interface CreateOrdersResponse {
  message: string;
  orders: any[];
}

/** Réponse GET /orders/my */
export interface MyOrdersResponse {
  orders: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private API_URI = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  /** Créer les commandes à partir du panier (CLIENT) */
  createOrdersFromCart(): Observable<CreateOrdersResponse> {
    return this.http.post<CreateOrdersResponse>(`${this.API_URI}/from-cart`, {});
  }

  /** Télécharger le PDF récapitulatif des commandes (CLIENT) */
  getReceiptPdf(orderIds: string[]): Observable<Blob> {
    return this.http.post(`${this.API_URI}/my/receipt-pdf`, { orderIds }, {
      responseType: 'blob'
    });
  }

  /** Liste des commandes du CLIENT connecté */
  getMyOrders(params?: { page?: number; limit?: number }): Observable<MyOrdersResponse> {
    let query = '';
    if (params) {
      const q: string[] = [];
      if (params.page != null) q.push(`page=${params.page}`);
      if (params.limit != null) q.push(`limit=${params.limit}`);
      if (q.length) query = '?' + q.join('&');
    }
    return this.http.get<MyOrdersResponse>(`${this.API_URI}/my${query}`);
  }

  /** Détail d'une commande (CLIENT) */
  getOrderById(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URI}/${id}`);
  }

  /** Liste des commandes de la boutique (BOUTIQUE) */
  getShopOrders(params?: { page?: number; limit?: number; status?: string }): Observable<MyOrdersResponse> {
    let query = '';
    if (params) {
      const q: string[] = [];
      if (params.page != null) q.push(`page=${params.page}`);
      if (params.limit != null) q.push(`limit=${params.limit}`);
      if (params.status && params.status.trim()) q.push(`status=${encodeURIComponent(params.status.trim())}`);
      if (q.length) query = '?' + q.join('&');
    }
    return this.http.get<MyOrdersResponse>(`${this.API_URI}/shop/my${query}`);
  }

  /** Détail d'une commande (BOUTIQUE) */
  getShopOrderById(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URI}/shop/${id}`);
  }

  /** Confirmer une commande (BOUTIQUE) */
  confirmOrder(id: string): Observable<{ message: string; order: any }> {
    return this.http.put<{ message: string; order: any }>(`${this.API_URI}/shop/${id}/confirm`, {});
  }

  /** Rejeter une commande (BOUTIQUE) */
  rejectOrder(id: string): Observable<{ message: string; order: any }> {
    return this.http.put<{ message: string; order: any }>(`${this.API_URI}/shop/${id}/reject`, {});
  }
}
