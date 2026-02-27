import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private API_URI = `${environment.apiUrl}/users`;
  private ADMIN_API_URI = `${environment.apiUrl}/admin`;

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

  getUserById(id: string) {
    return this.http.get<any>(`${this.API_URI}/${id}`);
  }

  createUser(userData: any) {
    return this.http.post<any>(`${this.API_URI}`, userData);
  }

  updateUser(id: string, userData: any) {
    return this.http.put<any>(`${this.API_URI}/${id}`, userData);
  }

  deleteUser(id: string) {
    return this.http.delete<any>(`${this.API_URI}/${id}`);
  }

  getUserActivity(
    userId: string,
    params?: { page?: number; limit?: number; actionType?: string }
  ): Observable<{
    user: any;
    logs: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let query = '';
    if (params) {
      const q = [];
      if (params.page) q.push(`page=${params.page}`);
      if (params.limit) q.push(`limit=${params.limit}`);
      if (params.actionType) q.push(`actionType=${params.actionType}`);
      if (q.length) query = '?' + q.join('&');
    }

    return this.http.get<{
      user: any;
      logs: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`${this.ADMIN_API_URI}/users/${userId}/activity${query}`);
  }

  getMyActivity(
    params?: { page?: number; limit?: number; actionType?: string }
  ): Observable<{
    logs: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let query = '';
    if (params) {
      const q = [];
      if (params.page) q.push(`page=${params.page}`);
      if (params.limit) q.push(`limit=${params.limit}`);
      if (params.actionType) q.push(`actionType=${params.actionType}`);
      if (q.length) query = '?' + q.join('&');
    }

    return this.http.get<{
      logs: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`${this.API_URI}/me/activity${query}`);
  }

  exportUserActivity(
    userId: string,
    format: 'json' | 'pdf',
    deleteAfterExport: boolean
  ): Observable<Blob> {
    const query = `?format=${format}&deleteAfterExport=${deleteAfterExport}`;
    return this.http.get(`${this.ADMIN_API_URI}/users/${userId}/activity/export${query}`, {
      responseType: 'blob'
    });
  }

  exportAllUsersActivity(
    format: 'json' | 'pdf',
    deleteAfterExport: boolean
  ): Observable<Blob> {
    const query = `?format=${format}&deleteAfterExport=${deleteAfterExport}`;
    return this.http.get(`${this.ADMIN_API_URI}/users/activity/export-all${query}`, {
      responseType: 'blob'
    });
  }
}