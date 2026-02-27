import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { ProductService } from '../../../../service/product.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  product: any = null;
  variants: any[] = [];
  shop: any = null;
  shopId: string | null = null;
  isLoading = true;
  error: string | null = null;
  modalImageUrl: string | null = null;

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

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modalImageUrl) this.closeImageModal();
  }
}
