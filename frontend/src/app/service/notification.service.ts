import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { map } from "rxjs/internal/operators/map";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class NotificationService {
    private API_URI = `${environment.apiUrl}/notifications`;

    constructor(private http: HttpClient) {}

    getUserNotifications(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URI}/user`);
    }

    getUnreadCount(userId: string) {
        return this.http
            .get<any[]>(`${this.API_URI}/user`)
            .pipe(
            map(notifs => notifs.filter(n => !n.isRead).length)
            );
    }

    markAsRead(notificationId: string) {
        return this.http.patch(`${this.API_URI}/${notificationId}/read`, {});
    }
    
    create(notificationData: any) {
        return this.http.post<any>(this.API_URI, notificationData);
    }
}