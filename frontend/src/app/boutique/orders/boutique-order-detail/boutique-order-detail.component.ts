import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../../theme/shared/shared.module';
import { CardComponent } from '../../../theme/shared/components/card/card.component';
import { OrderService } from '../../../service/order.service';

@Component({
  selector: 'app-boutique-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule, CardComponent],
  templateUrl: './boutique-order-detail.component.html',
  styleUrls: ['./boutique-order-detail.component.scss']
})
export class BoutiqueOrderDetailComponent implements OnInit {
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  order: any = null;
  isLoading = true;
  error: string | null = null;
  messageSuccess: string | null = null;
  messageError: string | null = null;
  isConfirming = false;
  isRejecting = false;

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
    this.orderService.getShopOrderById(id).subscribe({
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
    this.router.navigate(['/boutique/orders']);
  }

  get canConfirmOrReject(): boolean {
    return this.order?.status === 'PENDING';
  }

  confirmOrder(): void {
    if (!this.order?._id || !this.canConfirmOrReject) return;
    this.isConfirming = true;
    this.messageSuccess = null;
    this.messageError = null;
    this.orderService.confirmOrder(this.order._id).subscribe({
      next: (res) => {
        this.isConfirming = false;
        this.order = res?.order ?? this.order;
        if (this.order) this.order.status = 'CONFIRMED';
        this.messageSuccess = 'Commande confirmée. Le stock a été mis à jour.';
        setTimeout(() => (this.messageSuccess = null), 3000);
      },
      error: (err) => {
        this.isConfirming = false;
        this.messageError = err?.error?.message || 'Erreur lors de la confirmation.';
        setTimeout(() => (this.messageError = null), 5000);
        this.loadOrder(this.order._id);
      }
    });
  }

  rejectOrder(): void {
    if (!this.order?._id || !this.canConfirmOrReject) return;
    if (!window.confirm('Rejeter cette commande ? Le stock réservé sera libéré.')) return;
    this.isRejecting = true;
    this.messageSuccess = null;
    this.messageError = null;
    this.orderService.rejectOrder(this.order._id).subscribe({
      next: (res) => {
        this.isRejecting = false;
        this.order = res?.order ?? this.order;
        if (this.order) this.order.status = 'CANCELLED';
        this.messageSuccess = 'Commande rejetée. Le stock réservé a été libéré.';
        setTimeout(() => (this.messageSuccess = null), 3000);
      },
      error: (err) => {
        this.isRejecting = false;
        this.messageError = err?.error?.message || 'Erreur lors du rejet.';
        setTimeout(() => (this.messageError = null), 5000);
        this.loadOrder(this.order._id);
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

  getClientInfo(order: any): string {
    const u = order?.userId;
    if (!u) return '—';
    const parts: string[] = [];
    if (u.nom || u.prenom) parts.push([u.prenom, u.nom].filter(Boolean).join(' '));
    if (u.email) parts.push(u.email);
    if (u.telephone) parts.push(u.telephone);
    return parts.length ? parts.join(' • ') : u.username ?? '—';
  }
}
