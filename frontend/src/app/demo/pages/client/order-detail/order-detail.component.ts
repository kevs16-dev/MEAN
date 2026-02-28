import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../../../theme/shared/shared.module';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { OrderService } from '../../../../service/order.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule, CardComponent],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  order: any = null;
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Identifiant de commande manquant.';
      this.isLoading = false;
      return;
    }
    this.loadOrder(id);
  }

  loadOrder(id: string): void {
    this.isLoading = true;
    this.error = null;
    this.orderService.getOrderById(id).subscribe({
      next: (res) => {
        this.order = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Impossible de charger la commande.';
        this.order = null;
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/client/orders']);
  }

  goToShop(shopId: string): void {
    if (shopId) {
      this.router.navigate(['/client/shops', shopId]);
    }
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
}
