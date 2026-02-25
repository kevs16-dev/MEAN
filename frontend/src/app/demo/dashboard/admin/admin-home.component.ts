// Angular import
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Project import
import { CardComponent } from '../../../theme/shared/components/card/card.component';
import {
  AnalyticsService,
  BehaviorAnalyticsResponse,
  DailyTrend,
  DeviceBreakdown,
  TopPage,
  TrafficSource
} from '../../../service/analytics.service';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { FallOutline, RiseOutline } from '@ant-design/icons-angular/icons';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, IconDirective, NgApexchartsModule],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminHomeComponent implements OnInit {
  private iconService = inject(IconService);

  isLoading = true;
  errorMessage = '';
  selectedDays = 30;

  analyticsData: BehaviorAnalyticsResponse | null = null;
  topPages: TopPage[] = [];
  deviceBreakdown: DeviceBreakdown[] = [];
  trafficSources: TrafficSource[] = [];
  userTypeChartOptions: Partial<ApexOptions> = {};
  topPagesCurrentPage = 1;
  readonly topPagesPageSize = 3;
  topPagesSort: 'most' | 'least' = 'most';

  constructor(
    private analyticsService: AnalyticsService,
    private cdr: ChangeDetectorRef
  ) {
    this.iconService.addIcon(...[RiseOutline, FallOutline]);
  }

  ngOnInit(): void {
    this.scheduleLoad(this.selectedDays);
  }

  onPeriodChange(days: number): void {
    const parsedDays = Number(days);
    this.selectedDays = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 30;
    this.scheduleLoad(this.selectedDays);
  }

  private scheduleLoad(days: number): void {
    // Decale le chargement au prochain cycle pour eviter NG0100 en dev mode.
    setTimeout(() => this.loadAnalytics(days), 0);
  }

  loadAnalytics(days = this.selectedDays): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.selectedDays = days;
    this.cdr.markForCheck();

    this.analyticsService.getBehaviorAnalytics(days).subscribe({
      next: (data) => {
        setTimeout(() => {
          this.analyticsData = data;
          this.topPages = data.topPages;
          this.topPagesCurrentPage = 1;
          this.topPagesSort = 'most';
          this.deviceBreakdown = data.deviceBreakdown;
          this.trafficSources = data.trafficSources;
          this.userTypeChartOptions = this.buildUserTypeChart(data.dailyTrend);
          this.isLoading = false;
          this.cdr.markForCheck();
        }, 0);
      },
      error: (error) => {
        setTimeout(() => {
          this.isLoading = false;
          this.errorMessage =
            error?.error?.message || 'Impossible de charger les données Google Analytics pour le moment.';
          this.cdr.markForCheck();
        }, 0);
      }
    });
  }

  formatPercent(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  formatDuration(seconds: number): string {
    const total = Math.round(seconds || 0);
    const minutes = Math.floor(total / 60);
    const remainingSeconds = total % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  formatNumber(value: number): string {
    return Number(value || 0).toLocaleString('fr-FR');
  }

  get analyticCards() {
    const overview = this.analyticsData?.overview;
    if (!overview) return [];

    return [
      {
        title: 'Utilisateurs actifs',
        amount: this.formatNumber(overview.activeUsers),
        subtitle: `${this.formatNumber(overview.newUsers)} nouveaux`,
        background: 'bg-light-primary',
        border: 'border-primary',
        icon: 'rise',
        trend: this.formatPercent(overview.engagementRate),
        color: 'text-primary'
      },
      {
        title: 'Sessions',
        amount: this.formatNumber(overview.sessions),
        subtitle: `${this.formatDuration(overview.averageSessionDuration)} moyenne`,
        background: 'bg-light-primary',
        border: 'border-primary',
        icon: 'rise',
        trend: 'Moyenne',
        color: 'text-primary'
      },
      {
        title: 'Pages vues',
        amount: this.formatNumber(overview.screenPageViews),
        subtitle: `${this.formatNumber(overview.eventCount)} evenements`,
        background: 'bg-light-warning',
        border: 'border-warning',
        icon: 'rise',
        trend: 'Activité',
        color: 'text-warning'
      },
      {
        title: 'Taux de rebond',
        amount: this.formatPercent(overview.bounceRate),
        subtitle: 'A optimiser',
        background: 'bg-light-warning',
        border: 'border-warning',
        icon: 'fall',
        trend: this.formatPercent(overview.bounceRate),
        color: 'text-warning'
      }
    ];
  }

  get topPagesTotalPages(): number {
    return Math.max(1, Math.ceil(this.sortedTopPages.length / this.topPagesPageSize));
  }

  get sortedTopPages(): TopPage[] {
    const pages = [...this.topPages];
    if (this.topPagesSort === 'least') {
      return pages.sort((a, b) => a.screenPageViews - b.screenPageViews);
    }
    return pages.sort((a, b) => b.screenPageViews - a.screenPageViews);
  }

  get paginatedTopPages(): TopPage[] {
    const start = (this.topPagesCurrentPage - 1) * this.topPagesPageSize;
    return this.sortedTopPages.slice(start, start + this.topPagesPageSize);
  }

  get topPagesRangeStart(): number {
    if (!this.topPages.length) return 0;
    return (this.topPagesCurrentPage - 1) * this.topPagesPageSize + 1;
  }

  get topPagesRangeEnd(): number {
    return Math.min(this.topPagesCurrentPage * this.topPagesPageSize, this.topPages.length);
  }

  goToPreviousTopPagesPage(): void {
    if (this.topPagesCurrentPage > 1) {
      this.topPagesCurrentPage -= 1;
    }
  }

  goToNextTopPagesPage(): void {
    if (this.topPagesCurrentPage < this.topPagesTotalPages) {
      this.topPagesCurrentPage += 1;
    }
  }

  onTopPagesSortChange(value: 'most' | 'least'): void {
    this.topPagesSort = value === 'least' ? 'least' : 'most';
    this.topPagesCurrentPage = 1;
  }

  private buildUserTypeChart(trend: DailyTrend[]): Partial<ApexOptions> {
    const labels = trend.map((item) => this.formatGaDate(item.date));
    const newUsers = trend.map((item) => item.newUsers || 0);
    const knownUsers = trend.map((item) => Math.max((item.activeUsers || 0) - (item.newUsers || 0), 0));

    return {
      chart: {
        type: 'area',
        height: 320,
        toolbar: { show: false },
        background: 'transparent'
      },
      series: [
        { name: 'Nouveaux', data: newUsers },
        { name: 'Connus', data: knownUsers }
      ],
      colors: ['#1677ff', '#faad14'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [0, 100]
        }
      },
      grid: {
        strokeDashArray: 4,
        borderColor: '#f0f0f0'
      },
      legend: {
        show: true,
        position: 'top'
      },
      xaxis: {
        categories: labels,
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          formatter: (value) => `${Math.round(value)}`
        }
      },
      tooltip: {
        theme: 'light'
      }
    };
  }

  private formatGaDate(value: string): string {
    if (!value || value.length !== 8) return value;
    return `${value.slice(6, 8)}/${value.slice(4, 6)}`;
  }

  formatDisplayDate(value: string): string {
    if (!value) return value;

    // Format ISO: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-');
      return `${day}-${month}-${year}`;
    }

    // Format GA: YYYYMMDD
    if (/^\d{8}$/.test(value)) {
      return `${value.slice(6, 8)}-${value.slice(4, 6)}-${value.slice(0, 4)}`;
    }

    return value;
  }
}

