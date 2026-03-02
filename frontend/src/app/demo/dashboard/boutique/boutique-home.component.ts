// Angular import
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';

// Project import
import { CardComponent } from '../../../theme/shared/components/card/card.component';
import { OrderService } from '../../../service/order.service';
import { ReviewService } from '../../../service/review.service';
import { UserService } from '../../../service/user.service';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { RiseOutline } from '@ant-design/icons-angular/icons';

// Third party
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';

type ShopOrder = {
  _id?: string;
  createdAt?: string;
  totalAmount?: number;
  status?: string;
  items?: Array<{
    nameSnapshot?: string;
    quantity?: number;
    productId?: string | { _id?: string; name?: string };
  }>;
};

type DailySalesData = {
  labels: string[];
  values: number[];
  totalSales: number;
  totalOrders: number;
};

type MonthlyComparisonData = {
  values: number[];
  worstMonthLabel: string;
  currentMonthLabel: string;
  bestMonthLabel: string;
};

type ProductSalesRow = {
  key: string;
  name: string;
  quantity: number;
};

@Component({
  selector: 'app-boutique-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CardComponent, IconDirective, NgApexchartsModule],
  templateUrl: './boutique-home.component.html',
  styleUrls: ['./boutique-home.component.scss']
})
export class BoutiqueHomeComponent implements OnInit {
  private orderService = inject(OrderService);
  private reviewService = inject(ReviewService);
  private userService = inject(UserService);
  private iconService = inject(IconService);
  private allOrders: ShopOrder[] = [];

  isLoadingSales = true;
  salesError: string | null = null;
  selectedPeriodDays = 7;
  totalSales = 0;
  totalOrders = 0;
  chartOptions: Partial<ApexOptions> = {};
  monthlyHistogramOptions: Partial<ApexOptions> = {};
  monthlyHoverLabels: string[] = ['-', '-', '-'];
  topProductsBestSold: ProductSalesRow[] = [];
  topProductsLeastSold: ProductSalesRow[] = [];
  totalReviews = 0;
  averageRating: number | null = null;
  private shopId: string | null = null;

  constructor() {
    this.iconService.addIcon(...[RiseOutline]);
  }

  ngOnInit(): void {
    const user = this.userService.getUtilisateur();
    const rawShopId = user?.shopId;
    this.shopId = typeof rawShopId === 'string' ? rawShopId : rawShopId?._id || null;
    this.loadReviewMetrics();
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
      },
      {
        title: 'Avis reçus',
        amount: this.formatNumber(this.totalReviews),
        subtitle: 'Total des avis boutique',
        background: 'bg-light-success',
        border: 'border-success',
        icon: 'rise',
        trend: 'Réputation',
        color: 'text-success'
      },
      {
        title: 'Note',
        amount: this.averageRating == null ? '— /5' : `${this.averageRating.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} /5`,
        subtitle: 'Moyenne des avis',
        background: 'bg-light-info',
        border: 'border-info',
        icon: 'rise',
        trend: 'Qualité',
        color: 'text-info'
      }
    ];
  }

  private loadReviewMetrics(): void {
    if (!this.shopId) {
      this.totalReviews = 0;
      this.averageRating = null;
      return;
    }

    this.reviewService.getShopReviews(this.shopId, 1, 1).subscribe({
      next: (res) => {
        this.totalReviews = Number(res?.totalCount ?? res?.total ?? 0);
        this.averageRating = res?.averageRating ?? null;
      },
      error: () => {
        this.totalReviews = 0;
        this.averageRating = null;
      }
    });
  }

  get recentOrders(): ShopOrder[] {
    return [...this.allOrders]
      .filter((order) => !!order?.createdAt)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt ?? '').getTime();
        const dateB = new Date(b.createdAt ?? '').getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
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
          this.monthlyHistogramOptions = this.createMonthlyHistogramOptions([0, 0, 0], ['-', '-', '-']);
          this.topProductsBestSold = [];
          this.topProductsLeastSold = [];
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
    const periodOrders = this.getOrdersForSelectedPeriod(this.allOrders, this.selectedPeriodDays);
    const dailySales = this.buildDailySalesData(periodOrders, this.selectedPeriodDays);
    this.totalSales = dailySales.totalSales;
    this.totalOrders = dailySales.totalOrders;
    this.chartOptions = this.createChartOptions(dailySales.labels, dailySales.values);

    const monthlyComparison = this.buildMonthlyComparisonData(this.allOrders);
    this.monthlyHoverLabels = [
      monthlyComparison.worstMonthLabel,
      monthlyComparison.currentMonthLabel,
      monthlyComparison.bestMonthLabel
    ];
    this.monthlyHistogramOptions = this.createMonthlyHistogramOptions(monthlyComparison.values, this.monthlyHoverLabels);

    const { bestSold, leastSold } = this.buildTopProducts(periodOrders);
    this.topProductsBestSold = bestSold;
    this.topProductsLeastSold = leastSold;
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

  private buildMonthlyComparisonData(orders: ShopOrder[]): MonthlyComparisonData {
    const salesByMonth = new Map<string, number>();

    for (const order of orders) {
      if (!order?.createdAt) {
        continue;
      }

      const orderDate = new Date(order.createdAt);
      if (Number.isNaN(orderDate.getTime())) {
        continue;
      }

      const key = this.toMonthKey(orderDate);
      const amount = Number(order.totalAmount ?? 0);
      salesByMonth.set(key, (salesByMonth.get(key) ?? 0) + amount);
    }

    const currentMonthKey = this.toMonthKey(new Date());
    if (!salesByMonth.has(currentMonthKey)) {
      salesByMonth.set(currentMonthKey, 0);
    }

    const entries = [...salesByMonth.entries()].sort((a, b) => a[1] - b[1]);
    const worst = entries[0] ?? [currentMonthKey, 0];
    const best = entries[entries.length - 1] ?? [currentMonthKey, 0];
    const current = [currentMonthKey, salesByMonth.get(currentMonthKey) ?? 0] as const;

    return {
      values: [worst[1], current[1], best[1]].map((value) => Number(value.toFixed(2))),
      worstMonthLabel: this.toMonthDisplayLabel(worst[0]),
      currentMonthLabel: this.toMonthDisplayLabel(current[0]),
      bestMonthLabel: this.toMonthDisplayLabel(best[0])
    };
  }

  private createMonthlyHistogramOptions(values: number[], monthLabels: string[]): Partial<ApexOptions> {
    const categories = ['Pire mois', 'Mois actuel', 'Meilleur mois'];
    return {
      chart: {
        type: 'bar',
        height: 320,
        toolbar: { show: false },
        background: 'transparent'
      },
      series: [
        {
          name: 'Ventes mensuelles (€)',
          data: values
        }
      ],
      plotOptions: {
        bar: {
          distributed: true,
          columnWidth: '55%',
          borderRadius: 6
        }
      },
      xaxis: {
        categories
      },
      yaxis: {
        labels: {
          formatter: (value) => `${value.toFixed(0)} €`
        }
      },
      dataLabels: {
        enabled: false
      },
      colors: ['#ff7875', '#1677ff', '#73d13d'],
      tooltip: {
        x: {
          formatter: (_value: string, opts?: { dataPointIndex?: number }) => {
            const index = opts?.dataPointIndex ?? -1;
            const category = categories[index] ?? 'Mois';
            const month = monthLabels[index] ?? '-';
            return `${category} - ${month}`;
          }
        },
        y: {
          formatter: (value) => `${value.toFixed(2)} €`
        }
      },
      noData: {
        text: 'Aucune donnée'
      },
      grid: {
        borderColor: '#f5f5f5'
      }
    };
  }

  private getOrdersForSelectedPeriod(orders: ShopOrder[], daysCount: number): ShopOrder[] {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - daysCount + 1);

    return orders.filter((order) => {
      if (!order?.createdAt || order.status === 'CANCELLED') {
        return false;
      }
      const orderDate = new Date(order.createdAt);
      if (Number.isNaN(orderDate.getTime())) {
        return false;
      }
      return orderDate >= startDate && orderDate <= endDate;
    });
  }

  private buildTopProducts(orders: ShopOrder[]): { bestSold: ProductSalesRow[]; leastSold: ProductSalesRow[] } {
    const quantityByProduct = new Map<string, ProductSalesRow>();

    for (const order of orders) {
      const items = order.items ?? [];
      for (const item of items) {
        const quantity = Number(item?.quantity ?? 0);
        if (quantity <= 0) {
          continue;
        }

        const productId =
          typeof item.productId === 'string'
            ? item.productId
            : item.productId?._id;
        const productName =
          item.nameSnapshot?.trim() ||
          (typeof item.productId === 'object' ? item.productId?.name : '') ||
          'Produit sans nom';
        const key = productId || productName;

        const current = quantityByProduct.get(key);
        if (!current) {
          quantityByProduct.set(key, { key, name: productName, quantity });
        } else {
          current.quantity += quantity;
        }
      }
    }

    const rows = [...quantityByProduct.values()];
    const bestSold = [...rows]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);

    const leastSold = [...rows]
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 3);

    return { bestSold, leastSold };
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-warning text-dark';
      case 'CONFIRMED':
        return 'bg-primary';
      case 'SHIPPED':
        return 'bg-info';
      case 'DELIVERED':
        return 'bg-success';
      case 'CANCELLED':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  }

  getStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      SHIPPED: 'Expédiée',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée'
    };
    return labels[status ?? ''] ?? (status || 'Inconnu');
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private toMonthDisplayLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-').map((value) => Number(value));
    if (!year || !month) {
      return monthKey;
    }
    return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
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

