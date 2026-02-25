import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private API_URI = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getMyProducts() {
    return this.http.get<any[]>(`${this.API_URI}/my`);
  }

  getProductById(id: string) {
    return this.http.get<any>(`${this.API_URI}/${id}`);
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

