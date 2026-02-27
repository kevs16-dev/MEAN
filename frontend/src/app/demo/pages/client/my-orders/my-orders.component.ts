import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SharedModule } from '../../../../theme/shared/shared.module';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { OrderService } from '../../../../service/order.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule, CardComponent],
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss']
})
export class MyOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private router = inject(Router);

  orders: any[] = [];
  total = 0;
  page = 1;
  limit = 10;
  totalPages = 1;
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = null;
    this.orderService.getMyOrders({ page: this.page, limit: this.limit }).subscribe({
      next: (res) => {
        this.orders = res.orders ?? [];
        this.total = res.total ?? 0;
        this.page = res.page ?? 1;
        this.totalPages = res.totalPages ?? 1;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Impossible de charger les commandes.';
        this.orders = [];
        this.isLoading = false;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
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

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      SHIPPED: 'Expédiée',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée'
    };
    return labels[status] ?? status;
  }

  goToDetail(orderId: string): void {
    if (orderId) {
      this.router.navigate(['/client/orders', orderId]);
    }
  }
}
