import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private API_URI = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  updatePassword(passwordData: any) {
    return this.http.put<any>(`${this.API_URI}/update-password`, passwordData);
  }

  updateProfile(updateData: any) {
    return this.http.put<any>(`${this.API_URI}/update-profile`, updateData).pipe(
      tap(response => {
        if (response?.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
      })
    );
  }

  getUtilisateur(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getAllUsers(params?: { page?: number; limit?: number; role?: string }) {
    let query = '';
    if (params) {
      const q = [];
      if (params.page) q.push(`page=${params.page}`);
      if (params.limit) q.push(`limit=${params.limit}`);
      if (params.role && params.role !== 'ALL') q.push(`role=${params.role}`);
      if (q.length) query = '?' + q.join('&');
    }
    return this.http.get<{ users: any[]; total: number; page: number; limit: number }>(`${this.API_URI}${query}`);
  }
}