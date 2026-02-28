import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Review {
  _id: string;
  userId: { _id: string; nom: string; prenom: string; username?: string };
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface VariantReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  averageRating: number | null;
  totalCount: number;
}

export interface ShopReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  averageRating: number | null;
  totalCount: number;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private API_URI = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  // ========== Avis sur les variants ==========

  createVariantReview(productVariantId: string, rating: number, comment?: string): Observable<{ message: string; review: Review }> {
    return this.http.post<{ message: string; review: Review }>(`${this.API_URI}/variants`, {
      productVariantId,
      rating,
      comment: comment?.trim() || undefined
    });
  }

  getVariantReviews(productVariantId: string, page = 1, limit = 10): Observable<VariantReviewsResponse> {
    const params: Record<string, string> = {};
    if (page > 1) params['page'] = String(page);
    if (limit !== 10) params['limit'] = String(limit);
    const query = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    return this.http.get<VariantReviewsResponse>(`${this.API_URI}/variants/${productVariantId}${query}`);
  }

  getMyVariantReview(productVariantId: string): Observable<{ review: Review | null }> {
    return this.http.get<{ review: Review | null }>(`${this.API_URI}/variants/${productVariantId}/me`);
  }

  deleteVariantReview(reviewId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URI}/variants/${reviewId}`);
  }

  // ========== Avis sur les boutiques ==========

  createShopReview(shopId: string, rating: number, comment?: string): Observable<{ message: string; review: Review }> {
    return this.http.post<{ message: string; review: Review }>(`${this.API_URI}/shops`, {
      shopId,
      rating,
      comment: comment?.trim() || undefined
    });
  }

  getShopReviews(shopId: string, page = 1, limit = 10): Observable<ShopReviewsResponse> {
    const params: Record<string, string> = {};
    if (page > 1) params['page'] = String(page);
    if (limit !== 10) params['limit'] = String(limit);
    const query = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    return this.http.get<ShopReviewsResponse>(`${this.API_URI}/shops/${shopId}${query}`);
  }

  getMyShopReview(shopId: string): Observable<{ review: Review | null }> {
    return this.http.get<{ review: Review | null }>(`${this.API_URI}/shops/${shopId}/me`);
  }

  deleteShopReview(reviewId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URI}/shops/${reviewId}`);
  }
}
