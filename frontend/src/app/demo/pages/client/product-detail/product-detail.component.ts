import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, catchError } from 'rxjs';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { ProductService } from '../../../../service/product.service';
import { CartService } from '../../../../service/cart.service';
import { AuthService } from '../../../../service/auth.service';
import { ReviewService, type Review } from '../../../../service/review.service';

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
  private reviewService = inject(ReviewService);
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

  /** Avis variant : modal de notation */
  reviewModalVariant: any = null;
  reviewModalRating = 0;
  reviewModalHoverRating = 0;
  reviewModalComment = '';
  reviewModalMyReview: Review | null = null;
  reviewModalSubmitting = false;
  reviewModalError: string | null = null;

  /** Avis variant : popup liste sous la ligne */
  expandedVariantId: string | null = null;
  variantReviewsData: Record<string, { reviews: Review[]; averageRating: number | null; totalCount: number; loading: boolean }> = {};
  productReviewsLoading = false;
  productAverageRating: number | null = null;
  productReviewsTotal = 0;
  productReviews: Array<{ author: string; rating: number; comment: string; createdAt: string; variantLabel: string }> = [];
  scrollingProductReviews: Array<{ author: string; rating: number; comment: string; createdAt: string; variantLabel: string }> = [];

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
        if (this.canViewReviews() && this.variants.length > 0) {
          this.loadVariantReviewCounts();
          this.loadProductReviewsFeed();
        }
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

  /** Peut voir les avis (CLIENT ou BOUTIQUE) */
  canViewReviews(): boolean {
    const role = this.authService.getUserRole();
    return role === 'CLIENT' || role === 'BOUTIQUE';
  }

  /** Ouverture modal Noter */
  openReviewModal(v: any): void {
    this.reviewModalVariant = v;
    this.reviewModalRating = 0;
    this.reviewModalHoverRating = 0;
    this.reviewModalComment = '';
    this.reviewModalMyReview = null;
    this.reviewModalError = null;
    this.reviewService.getMyVariantReview(v._id).subscribe({
      next: (res) => {
        this.reviewModalMyReview = res.review ?? null;
        if (this.reviewModalMyReview) {
          this.reviewModalRating = this.reviewModalMyReview.rating;
          this.reviewModalComment = this.reviewModalMyReview.comment || '';
        }
      }
    });
  }

  closeReviewModal(): void {
    this.reviewModalVariant = null;
    this.reviewModalSubmitting = false;
  }

  setReviewStars(n: number): void {
    this.reviewModalRating = n;
  }

  submitReview(): void {
    if (!this.reviewModalVariant || this.reviewModalRating < 1) {
      this.reviewModalError = 'Veuillez sélectionner une note (1 à 5 étoiles).';
      return;
    }
    this.reviewModalSubmitting = true;
    this.reviewModalError = null;
    this.reviewService.createVariantReview(
      this.reviewModalVariant._id,
      this.reviewModalRating,
      this.reviewModalComment || undefined
    ).subscribe({
      next: () => {
        const variantId = this.reviewModalVariant._id;
        this.refreshVariantReviews(variantId);
        this.closeReviewModal();
        this.messageSuccess = 'Avis enregistré.';
        setTimeout(() => (this.messageSuccess = null), 3000);
      },
      error: (err) => {
        this.reviewModalError = err?.error?.message || 'Erreur lors de l\'enregistrement.';
        this.reviewModalSubmitting = false;
      }
    });
  }

  deleteMyVariantReview(): void {
    if (!this.reviewModalMyReview?._id) return;
    this.reviewModalSubmitting = true;
    this.reviewModalError = null;
    this.reviewService.deleteVariantReview(this.reviewModalMyReview._id).subscribe({
      next: () => {
        this.reviewModalMyReview = null;
        this.reviewModalRating = 0;
        this.reviewModalComment = '';
        this.refreshVariantReviews(this.reviewModalVariant._id);
        this.reviewModalSubmitting = false;
        this.messageSuccess = 'Avis supprimé.';
        setTimeout(() => (this.messageSuccess = null), 3000);
      },
      error: (err) => {
        this.reviewModalError = err?.error?.message || 'Erreur lors de la suppression.';
        this.reviewModalSubmitting = false;
      }
    });
  }

  refreshVariantReviews(variantId: string): void {
    const prev = this.variantReviewsData[variantId];
    if (prev) {
      prev.loading = true;
      this.reviewService.getVariantReviews(variantId).subscribe({
        next: (res) => {
          this.variantReviewsData[variantId] = {
            reviews: res.reviews,
            averageRating: res.averageRating,
            totalCount: res.totalCount,
            loading: false
          };
        },
        error: () => {
          if (this.variantReviewsData[variantId]) this.variantReviewsData[variantId].loading = false;
        }
      });
    }
  }

  loadVariantReviewCounts(): void {
    const variantIds = this.variants.filter((v) => v?._id).map((v) => v._id);
    if (variantIds.length === 0) return;

    const requests = variantIds.map((id) =>
      this.reviewService.getVariantReviews(id, 1, 1)
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        results.forEach((res, i) => {
          const id = variantIds[i];
          if (id) {
            this.variantReviewsData[id] = {
              reviews: res.reviews || [],
              averageRating: res.averageRating ?? null,
              totalCount: res.totalCount ?? res.total ?? 0,
              loading: false
            };
          }
        });
      }
    });
  }

  loadProductReviewsFeed(): void {
    const safeVariants = this.variants.filter((v) => !!v?._id);
    if (!safeVariants.length) {
      this.productAverageRating = null;
      this.productReviewsTotal = 0;
      this.productReviews = [];
      this.scrollingProductReviews = [];
      return;
    }

    this.productReviewsLoading = true;
    const requests = safeVariants.map((variant) =>
      this.reviewService.getVariantReviews(variant._id, 1, 5).pipe(
        catchError(() =>
          of({
            reviews: [],
            total: 0,
            page: 1,
            limit: 5,
            totalPages: 1,
            averageRating: null,
            totalCount: 0
          })
        )
      )
    );

    forkJoin(requests).subscribe((responses) => {
      const totalCount = responses.reduce((sum, res) => sum + Number(res?.totalCount || 0), 0);
      if (totalCount > 0) {
        const weighted =
          responses.reduce((sum, res) => sum + Number(res?.averageRating || 0) * Number(res?.totalCount || 0), 0) / totalCount;
        this.productAverageRating = Number(weighted.toFixed(1));
      } else {
        this.productAverageRating = null;
      }
      this.productReviewsTotal = totalCount;

      const flatReviews = responses.flatMap((res, idx) => {
        const variant = safeVariants[idx];
        const variantLabel = variant?.sku || this.getVariantLabel(variant) || 'Variant';
        const reviews = Array.isArray(res?.reviews) ? res.reviews : [];
        return reviews.map((review) => ({
          author: this.getReviewAuthorName(review),
          rating: review.rating,
          comment: review.comment || 'Aucun commentaire.',
          createdAt: review.createdAt,
          variantLabel
        }));
      });

      this.productReviews = flatReviews
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 12);
      this.scrollingProductReviews = this.productReviews.length > 1 ? [...this.productReviews, ...this.productReviews] : [...this.productReviews];
      this.productReviewsLoading = false;
    });
  }

  toggleReviewsPopup(variantId: string): void {
    if (this.expandedVariantId === variantId) {
      this.expandedVariantId = null;
      return;
    }
    this.expandedVariantId = variantId;
    const prev = this.variantReviewsData[variantId];
    this.variantReviewsData[variantId] = {
      reviews: prev?.reviews ?? [],
      averageRating: prev?.averageRating ?? null,
      totalCount: prev?.totalCount ?? 0,
      loading: true
    };
    this.reviewService.getVariantReviews(variantId, 1, 10).subscribe({
      next: (res) => {
        this.variantReviewsData[variantId] = {
          reviews: res.reviews,
          averageRating: res.averageRating,
          totalCount: res.totalCount,
          loading: false
        };
      },
      error: () => {
        this.variantReviewsData[variantId].loading = false;
      }
    });
  }

  getReviewAuthorName(r: Review): string {
    const u = r.userId;
    if (!u) return 'Anonyme';
    const parts = [u.prenom, u.nom].filter(Boolean);
    return parts.length ? parts.join(' ') : (u.username || 'Anonyme');
  }

  private getVariantLabel(v: any): string {
    if (!Array.isArray(v?.attributes) || v.attributes.length === 0) return '';
    return v.attributes
      .map((a: any) => `${a?.name || ''}: ${a?.value || ''}`.trim())
      .filter((x: string) => !!x)
      .join(', ');
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.modalImageUrl) this.closeImageModal();
    if (this.reviewModalVariant) this.closeReviewModal();
  }
}
