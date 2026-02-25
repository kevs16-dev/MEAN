import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

@Injectable({ providedIn: 'root' })
export class GaTrackerService {
  constructor(private router: Router) {}

  startTracking(): void {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
      return;
    }

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      const navigation = event as NavigationEnd;

      window.gtag?.('event', 'page_view', {
        page_path: navigation.urlAfterRedirects,
        page_location: window.location.href,
        page_title: document.title
      });
    });
  }
}
