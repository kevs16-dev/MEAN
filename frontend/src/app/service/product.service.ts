import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private API_URI = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getMyProducts(params?: { page?: number; limit?: number; search?: string }) {
    let query = '';
    if (params) {
      const q: string[] = [];
      if (params.page != null) q.push(`page=${params.page}`);
      if (params.limit != null) q.push(`limit=${params.limit}`);
      if (params.search != null && params.search !== '') q.push(`search=${encodeURIComponent(params.search)}`);
      if (q.length) query = '?' + q.join('&');
    }
    return this.http.get<{ products: any[]; total: number; page: number; limit: number; totalPages: number }>(
      `${this.API_URI}/my${query}`
    );
  }

  getProductById(id: string) {
    return this.http.get<any>(`${this.API_URI}/${id}`);
  }

  /** Produit + toutes ses variantes (page détail) */
  getMyProductWithVariants(id: string) {
    return this.http.get<{ product: any; variants: any[] }>(`${this.API_URI}/${id}/detail`);
  }

  createProduct(productData: any) {
    return this.http.post<any>(this.API_URI, productData);
  }

  updateProduct(id: string, productData: any) {
    return this.http.put<any>(`${this.API_URI}/${id}`, productData);
  }

  deleteProduct(id: string) {
    return this.http.delete<any>(`${this.API_URI}/${id}`);
  }

  getVariants(productId: string) {
    return this.http.get<any[]>(`${this.API_URI}/${productId}/variants`);
  }

  createVariant(productId: string, variantData: any) {
    return this.http.post<any>(`${this.API_URI}/${productId}/variants`, variantData);
  }

  updateVariant(productId: string, variantId: string, variantData: any) {
    return this.http.put<any>(`${this.API_URI}/${productId}/variants/${variantId}`, variantData);
  }

  deleteVariant(productId: string, variantId: string) {
    return this.http.delete<any>(`${this.API_URI}/${productId}/variants/${variantId}`);
  }
}

