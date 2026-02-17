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
}