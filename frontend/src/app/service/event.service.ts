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

  getEventsForRole(role: 'ADMIN' | 'BOUTIQUE' | 'CLIENT' | 'ALL', status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED') {
    let params = new HttpParams().set('role', role);
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<any[]>(`${this.API_URI}/role`, { params });
  }

  registerToPrivateEvent(eventId: string, ticketTypeName: string) {
    return this.http.post<any>(`${this.API_URI}/${eventId}/register`, { ticketTypeName });
  }

  downloadPrivateEventTicket(eventId: string) {
    return this.http.get(`${this.API_URI}/${eventId}/ticket`, {
      responseType: 'blob'
    });
  }

  getPrivateEventParticipants(eventId: string) {
    return this.http.get<{
      eventId: string;
      eventTitle: string;
      participants: Array<{
        ticketNumber: number;
        ticketCode: string;
        ticketTypeName: string;
        paf: number;
        registeredAt: string | null;
        participant: {
          id: string | null;
          nom: string;
          prenom: string;
          username: string;
          email: string;
        };
      }>;
    }>(`${this.API_URI}/${eventId}/participants`);
  }
}