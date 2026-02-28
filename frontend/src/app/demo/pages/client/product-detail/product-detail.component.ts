import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { ProductService } from '../../../../service/product.service';
import { CartService } from '../../../../service/cart.service';
import { AuthService } from '../../../../service/auth.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CardComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  product: any = null;
  variants: any[] = [];
  shop: any = null;
  shopId: string | null = null;
  isLoading = true;
  error: string | null = null;
  modalImageUrl: string | null = null;
  messageSuccess: string | null = null;
  messageError: string | null = null;
  /** Quantité saisie par variante (clé = _id variante) */
  variantQuantities: Record<string, number> = {};

  ngOnInit(): void {
    this.shopId = this.route.snapshot.paramMap.get('shopId');
    const productId = this.route.snapshot.paramMap.get('productId');
    if (!this.shopId || !productId) {
      this.error = 'Identifiant manquant.';
      this.isLoading = false;
      return;
    }
    this.productService.getProductWithVariantsByShop(this.shopId, productId).subscribe({
      next: (res) => {
        this.product = res.product ?? null;
        this.variants = Array.isArray(res.variants) ? res.variants : [];
        this.shop = res.shop ?? null;
        this.variantQuantities = {};
        this.variants.forEach((v) => {
          if (v?._id) this.variantQuantities[v._id] = 1;
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Impossible de charger le produit.';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    if (this.shopId) {
      this.router.navigate(['/client/shops', this.shopId, 'products']);
    } else {
      this.router.navigate(['/client/shops']);
    }
  }

  getProductImageUrl(p: any): string | null {
    const images = p?.images;
    if (!Array.isArray(images) || images.length === 0) return null;
    const primary = images.find((img: any) => img?.isPrimary && img?.url);
    if (primary?.url) return primary.url;
    return images[0]?.url || null;
  }

  openImageModal(url: string): void {
    if (url) this.modalImageUrl = url;
  }

  closeImageModal(): void {
    this.modalImageUrl = null;
  }

  /** Stock disponible pour le CLIENT (API envoie availableStock, sinon calcul local) */
  getAvailableStock(v: any): number {
    if (v?.availableStock != null && Number.isFinite(Number(v.availableStock))) {
      return Math.max(0, Number(v.availableStock));
    }
    const stock = Number(v?.stock) ?? 0;
    const reserved = Number(v?.reservedStock) ?? 0;
    return Math.max(0, stock - reserved);
  }

  /** Retourne true si l'utilisateur peut ajouter au panier (CLIENT uniquement) */
  isClient(): boolean {
    return this.authService.getUserRole() === 'CLIENT';
  }

  /** Quantité saisie pour une variante (défaut 1) */
  getQuantity(v: any): number {
    const q = this.variantQuantities[v?._id];
    return typeof q === 'number' && q >= 0 ? q : 1;
  }

  /** Met à jour la quantité saisie */
  setQuantity(v: any, qty: number): void {
    if (!v?._id) return;
    const n = Math.max(0, Math.floor(Number(qty) || 0));
    this.variantQuantities[v._id] = n;
  }

  /** Vérifie si l'ajout au panier est possible pour cette variante */
  canAddToCart(v: any): boolean {
    if (!this.isClient()) return false;
    const available = this.getAvailableStock(v);
    if (available < 1) return false;
    const qty = this.getQuantity(v);
    return qty >= 1 && qty <= available;
  }

  /** Ajoute la variante au panier */
  addToCart(v: any): void {
    if (!this.canAddToCart(v)) return;
    const qty = this.getQuantity(v);
    this.messageSuccess = null;
    this.messageError = null;
    this.cartService.addItem(v._id, qty).subscribe({
      next: () => {
        this.messageSuccess = `${v.sku || 'Article'} ajouté au panier (×${qty}).`;
        setTimeout(() => (this.messageSuccess = null), 3000);
      },
      error: (err) => {
        this.messageError = err?.error?.message || 'Erreur lors de l\'ajout au panier.';
        setTimeout(() => (this.messageError = null), 5000);
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modalImageUrl) this.closeImageModal();
  }
}
