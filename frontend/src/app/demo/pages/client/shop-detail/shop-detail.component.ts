import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { IconDirective } from '@ant-design/icons-angular';
import { ShopService } from '../../../../service/shop.service';
import { ProductService } from '../../../../service/product.service';
import { CartService } from '../../../../service/cart.service';
import { ReviewService, type Review } from '../../../../service/review.service';
import { AuthService } from '../../../../service/auth.service';

@Component({
  selector: 'app-shop-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconDirective],
  templateUrl: './shop-detail.component.html',
  styleUrls: ['./shop-detail.component.scss']
})
export class ShopDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private shopService = inject(ShopService);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private reviewService = inject(ReviewService);
  private authService = inject(AuthService);

  shop: any = null;
  isLoading = true;
  error: string | null = null;
  shopProducts: any[] = [];
  isLoadingShopProducts = false;
  shopProductsError: string | null = null;
  shopProductsSuccessMessage: string | null = null;
  shopProductsActionErrorMessage: string | null = null;
  productQuantities: Record<string, number> = {};
  orderingProductIds: Record<string, boolean> = {};
  productPrices: Record<string, number | null> = {};
  productRatings: Record<string, { averageRating: number | null; totalCount: number }> = {};

  /** Avis boutique */
  shopReviews: Review[] = [];
  shopAverageRating: number | null = null;
  shopReviewsTotal = 0;
  shopReviewsLoading = false;
  shopReviewsPage = 1;
  shopReviewsHasMore = false;
  myShopReview: Review | null = null;
  showReviewModal = false;
  reviewModalRating = 0;
  reviewModalHoverRating = 0;
  reviewModalComment = '';
  reviewModalSubmitting = false;
  reviewModalError: string | null = null;

  readonly DAYS = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' }
  ] as const;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/client/shops']);
      return;
    }
    this.loadShop(id);
  }

  loadShop(id: string): void {
    this.isLoading = true;
    this.error = null;
    this.shopService.getShopById(id).subscribe({
      next: (res) => {
        this.shop = res;
        this.isLoading = false;
        this.loadShopProducts(this.shop?._id || id);
        if (this.canViewReviews()) this.loadShopReviews();
        if (this.isClient()) this.loadMyShopReview();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Boutique introuvable.';
        this.shop = null;
        this.isLoading = false;
      }
    });
  }

  loadShopProducts(shopId: string): void {
    if (!shopId) {
      this.shopProducts = [];
      return;
    }
    this.isLoadingShopProducts = true;
    this.shopProductsError = null;
    this.productService.getProductsByShop(shopId, { page: 1, limit: 12 }).subscribe({
      next: (res) => {
        this.shopProducts = Array.isArray(res?.products) ? res.products : [];
        this.productQuantities = {};
        this.productPrices = {};
        this.productRatings = {};
        this.shopProducts.forEach((product) => {
          const id = String(product?._id || '');
          if (id) {
            this.productQuantities[id] = 1;
            this.productPrices[id] = null;
            this.productRatings[id] = { averageRating: null, totalCount: 0 };
          }
        });
        this.loadShopProductsPrices(shopId, this.shopProducts);
        this.isLoadingShopProducts = false;
      },
      error: (err) => {
        this.shopProducts = [];
        this.shopProductsError = err?.error?.message || 'Impossible de charger les produits de cette boutique.';
        this.isLoadingShopProducts = false;
      }
    });
  }

  canViewReviews(): boolean {
    const role = this.authService.getUserRole();
    return role === 'CLIENT' || role === 'BOUTIQUE';
  }

  isClient(): boolean {
    return this.authService.getUserRole() === 'CLIENT';
  }

  loadShopReviews(): void {
    if (!this.shop?._id) return;
    this.shopReviewsLoading = true;
    this.reviewService.getShopReviews(this.shop._id, 1, 10).subscribe({
      next: (res) => {
        this.shopReviews = res.reviews || [];
        this.shopAverageRating = res.averageRating ?? null;
        this.shopReviewsTotal = res.totalCount ?? res.total ?? 0;
        this.shopReviewsPage = 1;
        this.shopReviewsHasMore = res.page < res.totalPages;
        this.shopReviewsLoading = false;
      },
      error: () => {
        this.shopReviewsLoading = false;
      }
    });
  }

  loadMyShopReview(): void {
    if (!this.shop?._id) return;
    this.reviewService.getMyShopReview(this.shop._id).subscribe({
      next: (res) => {
        this.myShopReview = res.review ?? null;
      }
    });
  }

  openReviewModal(): void {
    this.showReviewModal = true;
    this.reviewModalRating = this.myShopReview?.rating ?? 0;
    this.reviewModalHoverRating = 0;
    this.reviewModalComment = this.myShopReview?.comment ?? '';
    this.reviewModalError = null;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.reviewModalSubmitting = false;
  }

  setReviewStars(n: number): void {
    this.reviewModalRating = n;
  }

  submitShopReview(): void {
    if (!this.shop?._id || this.reviewModalRating < 1) {
      this.reviewModalError = 'Veuillez sélectionner une note (1 à 5 étoiles).';
      return;
    }
    this.reviewModalSubmitting = true;
    this.reviewModalError = null;
    this.reviewService.createShopReview(this.shop._id, this.reviewModalRating, this.reviewModalComment || undefined).subscribe({
      next: () => {
        this.loadShopReviews();
        this.loadMyShopReview();
        this.closeReviewModal();
        this.reviewModalSubmitting = false;
      },
      error: (err) => {
        this.reviewModalError = err?.error?.message || 'Erreur lors de l\'enregistrement.';
        this.reviewModalSubmitting = false;
      }
    });
  }

  deleteMyShopReview(): void {
    if (!this.myShopReview?._id) return;
    this.reviewModalSubmitting = true;
    this.reviewModalError = null;
    this.reviewService.deleteShopReview(this.myShopReview._id).subscribe({
      next: () => {
        this.loadShopReviews();
        this.loadMyShopReview();
        this.closeReviewModal();
        this.reviewModalSubmitting = false;
      },
      error: (err) => {
        this.reviewModalError = err?.error?.message || 'Erreur lors de la suppression.';
        this.reviewModalSubmitting = false;
      }
    });
  }

  getReviewAuthorName(r: Review): string {
    const u = r.userId;
    if (!u) return 'Anonyme';
    const parts = [u.prenom, u.nom].filter(Boolean);
    return parts.length ? parts.join(' ') : (u.username || 'Anonyme');
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showReviewModal) this.closeReviewModal();
  }

  getCategoryName(): string {
    if (!this.shop?.category) return 'Non catégorisé';
    return typeof this.shop.category === 'object' && this.shop.category?.name
      ? this.shop.category.name
      : 'Non catégorisé';
  }

  getLocationString(): string {
    const parts: string[] = [];
    if (this.shop?.location?.floor) parts.push(`Étage ${this.shop.location.floor}`);
    if (this.shop?.location?.block) parts.push(`Bloc ${this.shop.location.block}`);
    return parts.length > 0 ? parts.join(' • ') : 'Non spécifié';
  }

  getOpeningHours(key: string): string {
    const hours = this.shop?.openingHours?.[key];
    return hours || '—';
  }

  getProductImageUrl(product: any): string {
    const images = Array.isArray(product?.images) ? product.images : [];
    const primary = images.find((img: any) => img?.isPrimary && img?.url);
    return primary?.url || images[0]?.url || 'assets/images/shop-placeholder.jpg';
  }

  getProductStock(product: any): number {
    const value = Number(product?.totalAvailableStock);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  getProductPrice(product: any): number | null {
    const id = String(product?._id || '');
    if (!id) return null;
    const price = this.productPrices[id];
    return typeof price === 'number' && Number.isFinite(price) ? price : null;
  }

  getProductRatingAverage(product: any): number | null {
    const id = String(product?._id || '');
    if (!id) return null;
    return this.productRatings[id]?.averageRating ?? null;
  }

  getProductRatingCount(product: any): number {
    const id = String(product?._id || '');
    if (!id) return 0;
    return Number(this.productRatings[id]?.totalCount || 0);
  }

  isFilledProductStar(rating: number | null, star: number): boolean {
    if (rating == null) return false;
    return star <= Math.round(rating);
  }

  getProductQuantity(product: any): number {
    const id = String(product?._id || '');
    const value = Number(this.productQuantities[id]);
    if (!id || !Number.isFinite(value) || value < 1) {
      return 1;
    }
    return Math.floor(value);
  }

  decreaseProductQuantity(product: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.setProductQuantity(product, this.getProductQuantity(product) - 1);
  }

  increaseProductQuantity(product: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.setProductQuantity(product, this.getProductQuantity(product) + 1);
  }

  private setProductQuantity(product: any, quantity: number): void {
    const id = String(product?._id || '');
    if (!id) return;
    const stock = this.getProductStock(product);
    const max = stock > 0 ? stock : 1;
    const sanitized = Math.min(Math.max(Math.floor(quantity) || 1, 1), max);
    this.productQuantities[id] = sanitized;
  }

  isOrderingProduct(product: any): boolean {
    const id = String(product?._id || '');
    return !!this.orderingProductIds[id];
  }

  openProductDetail(product: any): void {
    if (!this.shop?._id || !product?._id) return;
    this.router.navigate(['/client/shops', this.shop._id, 'products', product._id]);
  }

  orderProduct(product: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.shop?._id || !product?._id || !this.isClient()) return;

    const stock = this.getProductStock(product);
    const quantity = this.getProductQuantity(product);
    if (stock <= 0) {
      this.shopProductsActionErrorMessage = 'Ce produit est en rupture de stock.';
      this.shopProductsSuccessMessage = null;
      return;
    }

    this.shopProductsActionErrorMessage = null;
    this.shopProductsSuccessMessage = null;
    this.orderingProductIds[product._id] = true;

    this.productService.getProductWithVariantsByShop(this.shop._id, product._id).subscribe({
      next: (res) => {
        const variants = (Array.isArray(res?.variants) ? res.variants : []).filter((v: any) => v?.isActive !== false);
        const variantWithEnoughStock = variants.find((v: any) => this.getVariantAvailableStock(v) >= quantity);
        const fallbackVariant = variants.find((v: any) => this.getVariantAvailableStock(v) > 0);
        const selectedVariant = variantWithEnoughStock || fallbackVariant;

        if (!selectedVariant?._id) {
          this.shopProductsActionErrorMessage = 'Aucune variante commandable trouvée pour ce produit.';
          this.orderingProductIds[product._id] = false;
          return;
        }

        const selectedQty = variantWithEnoughStock ? quantity : 1;
        this.cartService.addItem(selectedVariant._id, selectedQty).subscribe({
          next: () => {
            this.shopProductsSuccessMessage = `${product?.name || 'Produit'} ajouté au panier.`;
            this.shopProductsActionErrorMessage = null;
            this.orderingProductIds[product._id] = false;
            setTimeout(() => (this.shopProductsSuccessMessage = null), 3000);
          },
          error: (err) => {
            this.shopProductsActionErrorMessage = err?.error?.message || 'Erreur lors de l\'ajout au panier.';
            this.orderingProductIds[product._id] = false;
          }
        });
      },
      error: () => {
        this.shopProductsActionErrorMessage = 'Impossible de préparer la commande pour ce produit.';
        this.orderingProductIds[product._id] = false;
      }
    });
  }

  private getVariantAvailableStock(variant: any): number {
    if (variant?.availableStock != null && Number.isFinite(Number(variant.availableStock))) {
      return Math.max(0, Number(variant.availableStock));
    }
    const stock = Number(variant?.stock) || 0;
    const reserved = Number(variant?.reservedStock) || 0;
    return Math.max(0, stock - reserved);
  }

  private loadShopProductsPrices(shopId: string, products: any[]): void {
    const safeProducts = (Array.isArray(products) ? products : []).filter((p) => !!p?._id);
    if (!shopId || safeProducts.length === 0) return;

    forkJoin(
      safeProducts.map((p) =>
        this.productService.getProductWithVariantsByShop(shopId, p._id).pipe(
          map((res) => {
            const variants = Array.isArray(res?.variants) ? res.variants : [];
            const prices = variants
              .map((v: any) => Number(v?.currentPrice))
              .filter((n: number) => Number.isFinite(n) && n >= 0);
            const minPrice = prices.length ? Math.min(...prices) : null;
            return { productId: String(p._id), price: minPrice };
          }),
          catchError(() => of({ productId: String(p._id), price: null }))
        )
      )
    ).subscribe((rows) => {
      rows.forEach((row) => {
        this.productPrices[row.productId] = row.price;
      });
    });

    forkJoin(
      safeProducts.map((p) =>
        this.productService.getProductWithVariantsByShop(shopId, p._id).pipe(
          switchMap((res) => {
            const variantIds = (Array.isArray(res?.variants) ? res.variants : [])
              .map((v: any) => String(v?._id || ''))
              .filter((id: string) => !!id);
            if (!variantIds.length) {
              return of({ productId: String(p._id), averageRating: null, totalCount: 0 });
            }
            return forkJoin(
              variantIds.map((variantId) =>
                this.reviewService.getVariantReviews(variantId, 1, 1).pipe(
                  map((reviewRes) => ({
                    averageRating: Number(reviewRes?.averageRating || 0),
                    totalCount: Number(reviewRes?.totalCount || 0)
                  })),
                  catchError(() => of({ averageRating: 0, totalCount: 0 }))
                )
              )
            ).pipe(
              map((ratings) => {
                const totalCount = ratings.reduce((sum, row) => sum + row.totalCount, 0);
                if (totalCount === 0) {
                  return { productId: String(p._id), averageRating: null, totalCount: 0 };
                }
                const weightedAverage =
                  ratings.reduce((sum, row) => sum + row.averageRating * row.totalCount, 0) / totalCount;
                return {
                  productId: String(p._id),
                  averageRating: Number(weightedAverage.toFixed(1)),
                  totalCount
                };
              })
            );
          }),
          catchError(() => of({ productId: String(p._id), averageRating: null, totalCount: 0 }))
        )
      )
    ).subscribe((rows) => {
      rows.forEach((row) => {
        this.productRatings[row.productId] = {
          averageRating: row.averageRating,
          totalCount: row.totalCount
        };
      });
    });
  }

  goBack(): void {
    this.router.navigate(['/client/shops']);
  }

  goToProducts(): void {
    if (this.shop?._id) {
      this.router.navigate(['/client/shops', this.shop._id, 'products']);
    }
  }
}
