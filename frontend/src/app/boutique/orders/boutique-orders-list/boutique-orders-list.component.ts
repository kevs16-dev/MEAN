import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../theme/shared/shared.module';
import { CardComponent } from '../../../theme/shared/components/card/card.component';
import { OrderService } from '../../../service/order.service';

@Component({
  selector: 'app-boutique-orders-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, CardComponent],
  templateUrl: './boutique-orders-list.component.html',
  styleUrls: ['./boutique-orders-list.component.scss']
})
export class BoutiqueOrdersListComponent implements OnInit {
  private orderService = inject(OrderService);
  private router = inject(Router);

  orders: any[] = [];
  total = 0;
  page = 1;
  limit = 10;
  totalPages = 1;
  statusFilter = '';
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = null;
    const params: { page?: number; limit?: number; status?: string } = {
      page: this.page,
      limit: this.limit
    };
    if (this.statusFilter.trim()) {
      params.status = this.statusFilter.trim();
    }
    this.orderService.getShopOrders(params).subscribe({
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

  onStatusFilterChange(): void {
    this.page = 1;
    this.loadOrders();
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

  getClientName(order: any): string {
    const u = order?.userId;
    if (!u) return '—';
    const parts = [u.nom, u.prenom].filter(Boolean);
    return parts.length ? parts.join(' ') : u.username ?? '—';
  }

  goToDetail(orderId: string): void {
    if (orderId) {
      this.router.navigate(['/boutique/orders', orderId]);
    }
  }
}
