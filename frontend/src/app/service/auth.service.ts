import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private API_URI = `${environment.apiUrl}/auth`;

    constructor(private http: HttpClient) { }

    inscription(data: { username: string, email: string, password: string, captchaToken?: string }) {
        return this.http.post(`${this.API_URI}/register`, data);
    }
}