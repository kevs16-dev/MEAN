import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, catchError, debounceTime, forkJoin, map, of, switchMap, takeUntil } from 'rxjs';
import { IconDirective } from '@ant-design/icons-angular';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { ProductService } from '../../../../service/product.service';
import { CartService } from '../../../../service/cart.service';
import { ReviewService } from '../../../../service/review.service';

@Component({
  selector: 'app-shop-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CardComponent, IconDirective],
  templateUrl: './shop-products.component.html',
  styleUrls: ['./shop-products.component.scss']
})
export class ShopProductsComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private reviewService = inject(ReviewService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  shop: any = null;
  products: any[] = [];
  isLoading = true;
  error: string | null = null;

  page = 1;
  limit = 10;
  limits = [5, 10, 20];
  total = 0;
  searchTerm = '';
  shopId: string | null = null;
  productPrices: Record<string, number | null> = {};
  productRatings: Record<string, { averageRating: number | null; totalCount: number }> = {};
  productQuantities: Record<string, number> = {};
  orderingProductIds: Record<string, boolean> = {};
  productsSuccessMessage: string | null = null;
  productsActionErrorMessage: string | null = null;

  private filterChanged$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.shopId = this.route.snapshot.paramMap.get('id');
    if (!this.shopId) {
      this.router.navigate(['/client/shops']);
      return;
    }

    this.filterChanged$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => {
      this.loadProducts();
    });

    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts(): void {
    if (!this.shopId) return;
    this.isLoading = true;
    this.error = null;
    this.productService
      .getProductsByShop(this.shopId, {
        page: this.page,
        limit: this.limit,
        search: this.searchTerm || undefined
      })
      .subscribe({
        next: (res) => {
          this.shop = res.shop || null;
          this.products = Array.isArray(res.products) ? res.products : [];
          this.initializeProductState();
          this.loadProductsPricing();
          this.total = typeof res.total === 'number' ? res.total : 0;
          if (res.page != null) this.page = res.page;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Impossible de charger les produits.';
          this.shop = null;
          this.products = [];
          this.total = 0;
          this.isLoading = false;
        }
      });
  }

  onSearch(): void {
    this.page = 1;
    this.filterChanged$.next();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadProducts();
  }

  onLimitChange(newLimit: number | string): void {
    const n = typeof newLimit === 'number' ? newLimit : parseInt(String(newLimit), 10);
    if (Number.isFinite(n) && this.limits.includes(n)) {
      this.limit = n;
      this.page = 1;
      this.filterChanged$.next();
    }
  }

  get totalPages(): number {
    const lim = this.limit || 1;
    const tot = this.total || 0;
    const pages = Math.ceil(tot / lim);
    return pages > 0 ? pages : 1;
  }

  goBackToShops(): void {
    this.router.navigate(['/client/shops']);
  }

  getProductImageUrl(product: any): string | null {
    const images = product?.images;
    if (!Array.isArray(images) || images.length === 0) return null;
    const primary = images.find((img: any) => img?.isPrimary && img?.url);
    if (primary?.url) return primary.url;
    return images[0]?.url || null;
  }

  viewVariants(product: any): void {
    if (!this.shopId || !product?._id) return;
    this.router.navigate(['/client/shops', this.shopId, 'products', product._id]);
  }

  getProductPrice(p: any): number | null {
    const id = String(p?._id || '');
    if (!id) return null;
    const price = this.productPrices[id];
    return typeof price === 'number' && Number.isFinite(price) ? price : null;
  }

  getProductQuantity(p: any): number {
    const id = String(p?._id || '');
    const value = Number(this.productQuantities[id]);
    if (!id || !Number.isFinite(value) || value < 1) return 1;
    return Math.floor(value);
  }

  getProductRatingAverage(p: any): number | null {
    const id = String(p?._id || '');
    if (!id) return null;
    return this.productRatings[id]?.averageRating ?? null;
  }

  getProductRatingCount(p: any): number {
    const id = String(p?._id || '');
    if (!id) return 0;
    return Number(this.productRatings[id]?.totalCount || 0);
  }

  isFilledProductStar(rating: number | null, star: number): boolean {
    if (rating == null) return false;
    return star <= Math.round(rating);
  }

  decreaseProductQuantity(p: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.setProductQuantity(p, this.getProductQuantity(p) - 1);
  }

  increaseProductQuantity(p: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.setProductQuantity(p, this.getProductQuantity(p) + 1);
  }

  isOrderingProduct(p: any): boolean {
    const id = String(p?._id || '');
    return !!this.orderingProductIds[id];
  }

  openProductDetail(p: any): void {
    this.viewVariants(p);
  }

  orderProduct(p: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.shopId || !p?._id) return;

    const stock = this.getTotalAvailableStock(p);
    const quantity = this.getProductQuantity(p);
    if (stock <= 0) {
      this.productsActionErrorMessage = 'Ce produit est en rupture de stock.';
      this.productsSuccessMessage = null;
      return;
    }

    this.productsActionErrorMessage = null;
    this.productsSuccessMessage = null;
    this.orderingProductIds[p._id] = true;

    this.productService.getProductWithVariantsByShop(this.shopId, p._id).subscribe({
      next: (res) => {
        const variants = (Array.isArray(res?.variants) ? res.variants : []).filter((v: any) => v?.isActive !== false);
        const variantWithEnoughStock = variants.find((v: any) => this.getVariantAvailableStock(v) >= quantity);
        const fallbackVariant = variants.find((v: any) => this.getVariantAvailableStock(v) > 0);
        const selectedVariant = variantWithEnoughStock || fallbackVariant;

        if (!selectedVariant?._id) {
          this.productsActionErrorMessage = 'Aucune variante commandable trouvée pour ce produit.';
          this.orderingProductIds[p._id] = false;
          return;
        }

        const selectedQty = variantWithEnoughStock ? quantity : 1;
        this.cartService.addItem(selectedVariant._id, selectedQty).subscribe({
          next: () => {
            this.productsSuccessMessage = `${p?.name || 'Produit'} ajouté au panier.`;
            this.productsActionErrorMessage = null;
            this.orderingProductIds[p._id] = false;
            setTimeout(() => (this.productsSuccessMessage = null), 3000);
          },
          error: (err) => {
            this.productsActionErrorMessage = err?.error?.message || 'Erreur lors de l\'ajout au panier.';
            this.orderingProductIds[p._id] = false;
          }
        });
      },
      error: () => {
        this.productsActionErrorMessage = 'Impossible de préparer la commande pour ce produit.';
        this.orderingProductIds[p._id] = false;
      }
    });
  }

  /** Stock total disponible (toutes variantes) pour le CLIENT */
  getTotalAvailableStock(p: any): number {
    const v = p?.totalAvailableStock;
    return typeof v === 'number' && v >= 0 ? v : 0;
  }

  /** Badge "En stock" ou "Rupture" */
  getProductStockLabel(p: any): string {
    const available = this.getTotalAvailableStock(p);
    return available > 0 ? 'En stock (' + available + ')' : 'Rupture';
  }

  getProductStockBadgeClass(p: any): string {
    const available = this.getTotalAvailableStock(p);
    return available > 0 ? 'bg-success' : 'bg-secondary';
  }

  private initializeProductState(): void {
    this.productPrices = {};
    this.productRatings = {};
    this.productQuantities = {};
    this.orderingProductIds = {};
    this.products.forEach((p) => {
      const id = String(p?._id || '');
      if (!id) return;
      this.productPrices[id] = null;
      this.productRatings[id] = { averageRating: null, totalCount: 0 };
      this.productQuantities[id] = 1;
      this.orderingProductIds[id] = false;
    });
  }

  private loadProductsPricing(): void {
    if (!this.shopId || !this.products.length) return;
    const safeProducts = this.products.filter((p) => !!p?._id);
    if (!safeProducts.length) return;

    forkJoin(
      safeProducts.map((p) =>
        this.productService.getProductWithVariantsByShop(this.shopId!, p._id).pipe(
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
        this.productService.getProductWithVariantsByShop(this.shopId!, p._id).pipe(
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

  private setProductQuantity(p: any, quantity: number): void {
    const id = String(p?._id || '');
    if (!id) return;
    const stock = this.getTotalAvailableStock(p);
    const max = stock > 0 ? stock : 1;
    const sanitized = Math.min(Math.max(Math.floor(quantity) || 1, 1), max);
    this.productQuantities[id] = sanitized;
  }

  private getVariantAvailableStock(variant: any): number {
    if (variant?.availableStock != null && Number.isFinite(Number(variant.availableStock))) {
      return Math.max(0, Number(variant.availableStock));
    }
    const stock = Number(variant?.stock) || 0;
    const reserved = Number(variant?.reservedStock) || 0;
    return Math.max(0, stock - reserved);
  }
}
