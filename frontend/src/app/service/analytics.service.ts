import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AnalyticsOverview {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  engagementRate: number;
  averageSessionDuration: number;
  eventCount: number;
  screenPageViews: number;
  bounceRate: number;
}

export interface TopPage {
  pagePath: string;
  pageTitle: string;
  screenPageViews: number;
  activeUsers: number;
}

export interface DeviceBreakdown {
  deviceCategory: string;
  activeUsers: number;
}

export interface TrafficSource {
  sourceMedium: string;
  sessions: number;
  activeUsers: number;
}

export interface DailyTrend {
  date: string;
  activeUsers: number;
  newUsers: number;
  sessions: number;
}

export interface BehaviorAnalyticsResponse {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  overview: AnalyticsOverview;
  topPages: TopPage[];
  deviceBreakdown: DeviceBreakdown[];
  trafficSources: TrafficSource[];
  dailyTrend: DailyTrend[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private API_URI = `${environment.apiUrl}/admin/analytics`;

  constructor(private http: HttpClient) {}

  getBehaviorAnalytics(days = 30): Observable<BehaviorAnalyticsResponse> {
    return this.http.get<BehaviorAnalyticsResponse>(`${this.API_URI}/behavior?days=${days}`);
  }
}
