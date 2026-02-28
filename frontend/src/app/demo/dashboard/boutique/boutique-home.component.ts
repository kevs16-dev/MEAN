// Angular import
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, of, switchMap } from 'rxjs';

// Project import
import { CardComponent } from '../../../theme/shared/components/card/card.component';
import { OrderService } from '../../../service/order.service';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { RiseOutline } from '@ant-design/icons-angular/icons';

// Third party
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';

type ShopOrder = {
  createdAt?: string;
  totalAmount?: number;
};

type DailySalesData = {
  labels: string[];
  values: number[];
  totalSales: number;
  totalOrders: number;
};

@Component({
  selector: 'app-boutique-home',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, IconDirective, NgApexchartsModule],
  templateUrl: './boutique-home.component.html',
  styleUrls: ['./boutique-home.component.scss']
})
export class BoutiqueHomeComponent implements OnInit {
  private orderService = inject(OrderService);
  private iconService = inject(IconService);
  private allOrders: ShopOrder[] = [];

  isLoadingSales = true;
  salesError: string | null = null;
  selectedPeriodDays = 7;
  totalSales = 0;
  totalOrders = 0;
  chartOptions: Partial<ApexOptions> = {};

  constructor() {
    this.iconService.addIcon(...[RiseOutline]);
  }

  ngOnInit(): void {
    this.loadDailySalesChart();
  }

  get analyticCards() {
    return [
      {
        title: 'Nombre de commandes',
        amount: this.formatNumber(this.totalOrders),
        subtitle: `Sur ${this.selectedPeriodDays} jours`,
        background: 'bg-light-primary',
        border: 'border-primary',
        icon: 'rise',
        trend: 'Activité',
        color: 'text-primary'
      },
      {
        title: "Chiffre d'affaires",
        amount: `${this.totalSales.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
        subtitle: `Sur ${this.selectedPeriodDays} jours`,
        background: 'bg-light-warning',
        border: 'border-warning',
        icon: 'rise',
        trend: 'Ventes',
        color: 'text-warning'
      }
    ];
  }

  private loadDailySalesChart(): void {
    this.isLoadingSales = true;
    this.salesError = null;

    const limit = 100;
    this.orderService
      .getShopOrders({ page: 1, limit })
      .pipe(
        switchMap((firstPage) => {
          const firstOrders = (firstPage.orders ?? []) as ShopOrder[];
          const totalPages = Math.max(1, firstPage.totalPages ?? 1);

          if (totalPages === 1) {
            return of(firstOrders);
          }

          const pageRequests = Array.from({ length: totalPages - 1 }, (_, index) =>
            this.orderService.getShopOrders({ page: index + 2, limit })
          );

          return forkJoin(pageRequests).pipe(
            map((responses) => {
              const remainingOrders = responses.flatMap((res) => (res.orders ?? []) as ShopOrder[]);
              return [...firstOrders, ...remainingOrders];
            })
          );
        }),
      )
      .subscribe({
        next: (orders) => {
          this.allOrders = orders;
          this.refreshChartFromCurrentPeriod();
          this.isLoadingSales = false;
        },
        error: () => {
          this.salesError = 'Impossible de charger les ventes.';
          this.chartOptions = this.createChartOptions([], []);
          this.isLoadingSales = false;
        }
      });
  }

  onPeriodChange(days: number): void {
    this.selectedPeriodDays = Number(days);
    this.refreshChartFromCurrentPeriod();
  }

  get periodRange(): { startDate: string; endDate: string } {
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - this.selectedPeriodDays + 1);

    return {
      startDate: this.formatDisplayDate(startDate),
      endDate: this.formatDisplayDate(endDate)
    };
  }

  private refreshChartFromCurrentPeriod(): void {
    const dailySales = this.buildDailySalesData(this.allOrders, this.selectedPeriodDays);
    this.totalSales = dailySales.totalSales;
    this.totalOrders = dailySales.totalOrders;
    this.chartOptions = this.createChartOptions(dailySales.labels, dailySales.values);
  }

  private buildDailySalesData(orders: ShopOrder[], daysCount: number): DailySalesData {
    const salesByDay = new Map<string, number>();
    const labels: string[] = [];

    for (let offset = daysCount - 1; offset >= 0; offset--) {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      currentDate.setDate(currentDate.getDate() - offset);

      const key = this.toDateKey(currentDate);
      salesByDay.set(key, 0);
      labels.push(this.toDisplayLabel(currentDate));
    }

    let totalSales = 0;
    let totalOrders = 0;

    for (const order of orders) {
      if (!order?.createdAt) {
        continue;
      }

      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      const key = this.toDateKey(orderDate);

      if (!salesByDay.has(key)) {
        continue;
      }

      const amount = Number(order.totalAmount ?? 0);
      salesByDay.set(key, (salesByDay.get(key) ?? 0) + amount);
      totalSales += amount;
      totalOrders += 1;
    }

    return {
      labels,
      values: [...salesByDay.values()].map((value) => Number(value.toFixed(2))),
      totalSales: Number(totalSales.toFixed(2)),
      totalOrders
    };
  }

  private createChartOptions(labels: string[], values: number[]): Partial<ApexOptions> {
    return {
      chart: {
        type: 'area',
        height: 320,
        toolbar: { show: false },
        background: 'transparent'
      },
      series: [
        {
          name: 'Ventes (€)',
          data: values
        }
      ],
      xaxis: {
        categories: labels
      },
      yaxis: {
        labels: {
          formatter: (value) => `${value.toFixed(0)} €`
        }
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      dataLabels: {
        enabled: false
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.05
        }
      },
      tooltip: {
        y: {
          formatter: (value) => `${value.toFixed(2)} €`
        }
      },
      noData: {
        text: 'Aucune donnée'
      },
      colors: ['#1677ff'],
      grid: {
        borderColor: '#f5f5f5'
      }
    };
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toDisplayLabel(date: Date): string {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  private formatNumber(value: number): string {
    return Number(value || 0).toLocaleString('fr-FR');
  }

  private formatDisplayDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}

