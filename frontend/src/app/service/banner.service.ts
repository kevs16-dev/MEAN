import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BannerService {
  private API_URI = `${environment.apiUrl}/banners`;

  constructor(private http: HttpClient) {}

  getBanners(includeAll = false) {
    let params = new HttpParams();
    if (includeAll) {
      params = params.set('all', '1');
    }
    return this.http.get<{ banners: any[] }>(this.API_URI, { params });
  }

  createBanner(formData: FormData) {
    return this.http.post<any>(this.API_URI, formData);
  }

  deleteBanner(id: string) {
    return this.http.delete<any>(`${this.API_URI}/${id}`);
  }
}
