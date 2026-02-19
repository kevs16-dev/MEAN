import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private API_URI = `${environment.apiUrl}/auth`;
    private TOKEN_KEY = 'token';

    constructor(private http: HttpClient, private router: Router) { }
    
    estAuthentifie(): boolean {
        return !!localStorage.getItem(this.TOKEN_KEY);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    getUser(): any | null {
        const raw = localStorage.getItem('user');
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    getUserRole(): string | null {
        return this.getUser()?.role || null;
    }

    deconnexion() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
    }

    connexion(data: { email: string, password: string }) {
        return this.http.post<any>(`${this.API_URI}/login`, data).pipe(
            tap(response => {
                if (response?.token) {
                    localStorage.setItem(this.TOKEN_KEY, response.token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                }
            })
        );
    }

    inscription(data) {
        return this.http.post(`${this.API_URI}/register`, data);
    }
}