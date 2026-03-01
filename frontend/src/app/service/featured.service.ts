import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FeaturedVariant {
  variant: {
    _id: string;
    sku?: string;
    attributes: { name: string; value: string }[];
    currentPrice: number;
    soldCount: number;
    imageUrl?: string;
  };
  product: {
    _id: string;
    name: string;
    description?: string;
    images: { url: string; isPrimary?: boolean }[];
  };
  shop: {
    _id: string;
    name: string;
    slug: string;
  };
}

@Injectable({ providedIn: 'root' })
export class FeaturedService {
  private API_URI = `${environment.apiUrl}/featured`;

  constructor(private http: HttpClient) {}

  getBestSellingVariant(): Observable<{ featured: FeaturedVariant | null }> {
    return this.http.get<{ featured: FeaturedVariant | null }>(
      `${this.API_URI}/best-selling-variant`
    );
  }
}
