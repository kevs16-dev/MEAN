import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EventService {

    private API_URI = `${environment.apiUrl}/events`;

    constructor(private http: HttpClient) {}

    createEvent(eventData: any) {
        return this.http.post<any>(this.API_URI, eventData);
    }

    getAllEvents() {
        return this.http.get<any[]>(this.API_URI);
    }

    getEventsByStatus(status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED') {
        const params = new HttpParams().set('status', status);
        return this.http.get<any[]>(`${this.API_URI}/status`, { params });
    }

    getEventsForRole(role: 'ADMIN' | 'BOUTIQUE' | 'CLIENT' | 'ALL') {
        const params = new HttpParams().set('role', role);
        return this.http.get<any[]>(`${this.API_URI}/role`, { params });
    }
}