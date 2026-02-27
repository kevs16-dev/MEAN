import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SharedModule } from '../../../../theme/shared/shared.module';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { CartService, CartResponse, CartItem } from '../../../../service/cart.service';
import { OrderService } from '../../../../service/order.service';
import { AuthService } from '../../../../service/auth.service';

/** Groupe d'items par boutique */
interface ShopGroup {
  shopId: string;
  shopName: string;
  items: CartItem[];
  shopSubtotal: number;
}

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, CardComponent],
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.scss']
})
export class CartPageComponent implements OnInit {
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private router = inject(Router);

  cart: CartResponse | null = null;
  groupedByShop: ShopGroup[] = [];
  isLoading = true;
  error: string | null = null;
  messageSuccess: string | null = null;
  messageError: string | null = null;
  isPlacingOrder = false;

  /** Quantité saisie (pour input) - clé = productVariantId */
  quantities: Record<string, number> = {};

  ngOnInit(): void {
    if (this.authService.getUserRole() !== 'CLIENT') {
      this.router.navigate(['/client/home']);
      return;
    }
    this.loadCart();
  }

  loadCart(): void {
    this.isLoading = true;
    this.error = null;
    this.cartService.getCart().subscribe({
      next: (res) => {
        this.cart = res;
        this.groupedByShop = this.buildGroupedByShop(res);
        this.initQuantities(res);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Impossible de charger le panier.';
        this.cart = null;
        this.groupedByShop = [];
        this.isLoading = false;
      }
    });
  }

  private buildGroupedByShop(cart: CartResponse): ShopGroup[] {
    const items = cart?.items ?? [];
    const byShop = new Map<string, { shopName: string; items: CartItem[]; shopSubtotal: number }>();

    for (const item of items) {
      const sid = item.shop._id;
      const shopName = item.shop.name;
      if (!byShop.has(sid)) {
        byShop.set(sid, { shopName, items: [], shopSubtotal: 0 });
      }
      const g = byShop.get(sid)!;
      g.items.push(item);
      g.shopSubtotal += item.subtotal;
    }

    return Array.from(byShop.entries()).map(([shopId, g]) => ({
      shopId,
      shopName: g.shopName,
      items: g.items,
      shopSubtotal: g.shopSubtotal
    }));
  }

  private initQuantities(cart: CartResponse): void {
    this.quantities = {};
    for (const item of cart?.items ?? []) {
      this.quantities[item.productVariantId] = item.quantity;
    }
  }

  getQuantity(item: CartItem): number {
    const q = this.quantities[item.productVariantId];
    return typeof q === 'number' && q >= 0 ? q : item.quantity;
  }

  setQuantity(item: CartItem, value: string | number): void {
    const n = Math.max(0, Math.floor(Number(value) || 0));
    this.quantities[item.productVariantId] = n;
  }

  /** Vérifie si la quantité est valide pour mise à jour */
  canUpdateQuantity(item: CartItem): boolean {
    const qty = this.getQuantity(item);
    const available = item.variant?.availableStock ?? 0;
    return qty >= 1 && qty <= available;
  }

  updateQuantity(item: CartItem): void {
    const qty = this.getQuantity(item);
    if (qty < 1) {
      this.removeItem(item);
      return;
    }
    const available = item.variant?.availableStock ?? 0;
    if (qty > available) {
      this.messageError = `Stock disponible insuffisant (max: ${available}) pour "${item.product?.name}".`;
      setTimeout(() => (this.messageError = null), 5000);
      this.quantities[item.productVariantId] = Math.min(available, item.quantity);
      return;
    }
    this.cartService.updateItemQuantity(item.productVariantId, qty).subscribe({
      next: (res) => {
        this.cart = res.cart;
        this.groupedByShop = this.buildGroupedByShop(res.cart);
        this.messageSuccess = 'Quantité mise à jour.';
        setTimeout(() => (this.messageSuccess = null), 2000);
      },
      error: (err) => {
        this.messageError = err?.error?.message || 'Erreur lors de la mise à jour.';
        setTimeout(() => (this.messageError = null), 5000);
        this.loadCart();
      }
    });
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.productVariantId).subscribe({
      next: (res) => {
        this.cart = res.cart;
        this.groupedByShop = this.buildGroupedByShop(res.cart);
        this.messageSuccess = 'Article supprimé du panier.';
        setTimeout(() => (this.messageSuccess = null), 2000);
      },
      error: (err) => {
        this.messageError = err?.error?.message || 'Erreur lors de la suppression.';
        setTimeout(() => (this.messageError = null), 5000);
        this.loadCart();
      }
    });
  }

  get grandTotal(): number {
    return this.groupedByShop.reduce((sum, g) => sum + g.shopSubtotal, 0);
  }

  passerCommande(): void {
    if (!this.cart?.items?.length) {
      this.messageError = 'Panier vide.';
      setTimeout(() => (this.messageError = null), 3000);
      return;
    }
    this.isPlacingOrder = true;
    this.messageSuccess = null;
    this.messageError = null;
    this.orderService.createOrdersFromCart().subscribe({
      next: (res) => {
        this.isPlacingOrder = false;
        const count = res?.orders?.length ?? 0;
        this.messageSuccess = `${count} commande(s) passée(s) avec succès !`;
        setTimeout(() => {
          this.router.navigate(['/client/orders']);
        }, 1500);
      },
      error: (err) => {
        this.isPlacingOrder = false;
        this.messageError = err?.error?.message || 'Erreur lors du passage de commande.';
        setTimeout(() => (this.messageError = null), 6000);
      }
    });
  }

  goToShops(): void {
    this.router.navigate(['/client/shops']);
  }
}
