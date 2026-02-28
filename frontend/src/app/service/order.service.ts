import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateOrdersResponse {
  message: string;
  orders: any[];
}

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

  createOrdersFromCart(): Observable<CreateOrdersResponse> {
    return this.http.post<CreateOrdersResponse>(`${this.API_URI}/from-cart`, {});
  }

  getReceiptPdf(orderIds: string[]): Observable<Blob> {
    return this.http.post(`${this.API_URI}/my/receipt-pdf`, { orderIds }, {
      responseType: 'blob'
    });
  }

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

  getOrderById(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URI}/${id}`);
  }

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

  getShopOrderById(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URI}/shop/${id}`);
  }

  confirmOrder(id: string): Observable<{ message: string; order: any }> {
    return this.http.put<{ message: string; order: any }>(`${this.API_URI}/shop/${id}/confirm`, {});
  }

  rejectOrder(id: string): Observable<{ message: string; order: any }> {
    return this.http.put<{ message: string; order: any }>(`${this.API_URI}/shop/${id}/reject`, {});
  }
}
