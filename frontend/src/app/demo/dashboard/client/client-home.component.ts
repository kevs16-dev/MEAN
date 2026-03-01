// Angular import
import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';

// Project import
import { BannerService } from '../../../service/banner.service';
import { ShopService } from '../../../service/shop.service';
import { ProductService } from '../../../service/product.service';
import { CartService } from '../../../service/cart.service';
import { ReviewService } from '../../../service/review.service';
import { AuthService } from '../../../service/auth.service';

type FeaturedProduct = {
  productId: string;
  shopId: string;
  shopName: string;
  name: string;
  description: string;
  imageUrl: string;
  soldCount: number;
  price: number | null;
  variantId: string | null;
  availableStock: number;
  variantIds: string[];
  rating: number | null;
  ratingCount: number;
};

type RatingSummary = {
  averageRating: number | null;
  totalCount: number;
};

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-home.component.html',
  styleUrls: ['./client-home.component.scss']
})
export class ClientHomeComponent implements OnInit, OnDestroy {
  private bannerService = inject(BannerService);
  private shopService = inject(ShopService);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private reviewService = inject(ReviewService);
  private authService = inject(AuthService);

  banners: any[] = [];
  shopLogos: Array<{ name: string; image: string }> = [];
  scrollingShopLogos: Array<{ name: string; image: string }> = [];
  featuredProducts: FeaturedProduct[] = [];
  isLoadingFeaturedProducts = false;
  featuredProductsError: string | null = null;
  featuredProductsSuccessMessage: string | null = null;
  featuredProductsErrorMessage: string | null = null;
  featuredStartIndex = 0;
  featuredVisibleCount = 3;
  currentSlide = 0;
  private sliderTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadBanners();
    this.loadShopLogos();
    this.updateFeaturedVisibleCount();
    this.loadFeaturedProducts();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  loadBanners(): void {
    this.bannerService.getBanners().subscribe({
      next: (resp) => {
        this.banners = Array.isArray(resp?.banners) ? resp.banners : [];
        this.currentSlide = 0;
        this.startAutoSlide();
      },
      error: () => {
        this.banners = [];
      }
    });
  }

  loadShopLogos(): void {
    this.shopService.getShops().subscribe({
      next: (resp) => {
        const list = Array.isArray(resp)
          ? resp
          : Array.isArray((resp as any)?.shops)
          ? (resp as any).shops
          : Array.isArray((resp as any)?.data)
          ? (resp as any).data
          : [];

        this.shopLogos = list
          .filter((shop: any) => (shop?.status || '').toUpperCase() === 'ACTIVE')
          .map((shop: any) => ({
            name: shop?.name || 'Boutique',
            image: shop?.logo || shop?.coverImage || ''
          }))
          .filter((shop: { image: string }) => !!shop.image);

        this.scrollingShopLogos =
          this.shopLogos.length > 0 ? [...this.shopLogos, ...this.shopLogos] : [];
      },
      error: () => {
        this.shopLogos = [];
        this.scrollingShopLogos = [];
      }
    });
  }

  loadFeaturedProducts(): void {
    this.isLoadingFeaturedProducts = true;
    this.featuredProductsError = null;

    this.shopService
      .getShops()
      .pipe(
        map((resp) => {
          const list = Array.isArray(resp)
            ? resp
            : Array.isArray((resp as any)?.shops)
            ? (resp as any).shops
            : Array.isArray((resp as any)?.data)
            ? (resp as any).data
            : [];
          return list.filter((shop: any) => (shop?.status || '').toUpperCase() === 'ACTIVE');
        }),
        switchMap((shops: any[]) => {
          if (!shops.length) {
            return of([] as any[]);
          }
          return forkJoin(
            shops.map((shop: any) =>
              this.productService.getProductsByShop(shop._id, { page: 1, limit: 100 }).pipe(
                map((res) => ({
                  shopId: shop._id,
                  shopName: shop?.name || 'Boutique',
                  products: Array.isArray(res?.products) ? res.products : []
                })),
                catchError(() => of({ shopId: shop._id, shopName: shop?.name || 'Boutique', products: [] }))
              )
            )
          );
        }),
        map((shopProducts) =>
          shopProducts.flatMap((entry: any) =>
            (entry.products || []).map((product: any) => ({
              shopId: entry.shopId,
              shopName: entry.shopName,
              productId: product?._id,
              product
            }))
          )
        ),
        switchMap((productRefs: any[]) => {
          const safeRefs = productRefs.filter((ref) => !!ref?.shopId && !!ref?.productId);
          if (!safeRefs.length) {
            return of([] as FeaturedProduct[]);
          }
          return forkJoin(
            safeRefs.map((ref) =>
              this.productService.getProductWithVariantsByShop(ref.shopId, ref.productId).pipe(
                map((detail) => this.buildFeaturedProduct(ref, detail)),
                catchError(() => of(null))
              )
            )
          ).pipe(map((items) => items.filter((item): item is FeaturedProduct => !!item)));
        }),
        map((items: FeaturedProduct[]) =>
          [...items]
            .filter((item) => item.soldCount > 0)
            .sort((a, b) => b.soldCount - a.soldCount)
            .slice(0, 6)
        ),
        switchMap((items: FeaturedProduct[]) => {
          if (!items.length) {
            return of([] as FeaturedProduct[]);
          }
          return forkJoin(
            items.map((item) =>
              this.loadProductRating(item.variantIds).pipe(
                map((ratingData) => ({
                  ...item,
                  rating: ratingData.averageRating,
                  ratingCount: ratingData.totalCount
                })),
                catchError(() => of({ ...item, rating: null, ratingCount: 0 }))
              )
            )
          );
        })
      )
      .subscribe({
        next: (items) => {
          this.featuredProducts = items;
          this.featuredStartIndex = 0;
          this.isLoadingFeaturedProducts = false;
        },
        error: () => {
          this.featuredProducts = [];
          this.featuredProductsError = 'Impossible de charger les produits phares.';
          this.isLoadingFeaturedProducts = false;
        }
      });
  }

  private buildFeaturedProduct(ref: any, detail: any): FeaturedProduct | null {
    const product = detail?.product || ref?.product;
    const rawVariants = Array.isArray(detail?.variants) ? detail.variants : [];
    const variants = rawVariants.filter((variant: any) => variant?.isActive !== false);
    if (!product?._id || !ref?.shopId || variants.length === 0) {
      return null;
    }

    const soldCount = variants.reduce((sum: number, variant: any) => sum + Math.max(0, Number(variant?.soldCount || 0)), 0);
    const variantIds = variants.map((variant: any) => variant?._id).filter((id: any) => !!id);
    if (!variantIds.length) {
      return null;
    }

    const sortedVariants = [...variants].sort((a: any, b: any) => Number(b?.soldCount || 0) - Number(a?.soldCount || 0));
    const topVariant = sortedVariants[0];
    const availableStock = this.getVariantAvailableStock(topVariant);

    return {
      productId: product._id,
      shopId: ref.shopId,
      shopName: ref.shopName,
      name: product?.name || 'Produit',
      description: product?.description || '',
      imageUrl: this.resolveProductImage(product, variants),
      soldCount,
      price: Number.isFinite(Number(topVariant?.currentPrice)) ? Number(topVariant.currentPrice) : null,
      variantId: topVariant?._id || null,
      availableStock,
      variantIds,
      rating: null,
      ratingCount: 0
    };
  }

  private resolveProductImage(product: any, variants: any[]): string {
    const images = Array.isArray(product?.images) ? product.images : [];
    const primaryImage = images.find((image: any) => image?.isPrimary && image?.url)?.url;
    const productImage = primaryImage || images[0]?.url;
    const variantImage = variants.find((variant: any) => !!variant?.imageUrl)?.imageUrl;
    return productImage || variantImage || 'assets/images/shop-placeholder.jpg';
  }

  private getVariantAvailableStock(variant: any): number {
    if (variant?.availableStock != null && Number.isFinite(Number(variant.availableStock))) {
      return Math.max(0, Number(variant.availableStock));
    }
    const stock = Number(variant?.stock) || 0;
    const reserved = Number(variant?.reservedStock) || 0;
    return Math.max(0, stock - reserved);
  }

  private loadProductRating(variantIds: string[]): Observable<RatingSummary> {
    if (!variantIds.length) {
      return of({ averageRating: null, totalCount: 0 });
    }

    return forkJoin(
      variantIds.map((variantId) =>
        this.reviewService.getVariantReviews(variantId, 1, 1).pipe(
          map((res) => ({
            averageRating: Number(res?.averageRating || 0),
            totalCount: Number(res?.totalCount || 0)
          })),
          catchError(() => of({ averageRating: 0, totalCount: 0 }))
        )
      )
    ).pipe(
      map((ratings: Array<{ averageRating: number; totalCount: number }>) => {
        const totalCount = ratings.reduce((sum, row) => sum + row.totalCount, 0);
        if (totalCount === 0) {
          return { averageRating: null, totalCount: 0 };
        }
        const weighted = ratings.reduce((sum, row) => sum + row.averageRating * row.totalCount, 0) / totalCount;
        return { averageRating: Number(weighted.toFixed(1)), totalCount };
      })
    );
  }

  isClient(): boolean {
    return this.authService.getUserRole() === 'CLIENT';
  }

  get visibleFeaturedProducts(): FeaturedProduct[] {
    if (this.featuredProducts.length <= this.featuredVisibleCount) {
      return this.featuredProducts;
    }

    const visible: FeaturedProduct[] = [];
    for (let i = 0; i < this.featuredVisibleCount; i++) {
      const index = (this.featuredStartIndex + i) % this.featuredProducts.length;
      visible.push(this.featuredProducts[index]);
    }
    return visible;
  }

  canSlideFeaturedProducts(): boolean {
    return this.featuredProducts.length > this.featuredVisibleCount;
  }

  nextFeaturedProducts(): void {
    if (!this.canSlideFeaturedProducts()) {
      return;
    }
    this.featuredStartIndex = (this.featuredStartIndex + 1) % this.featuredProducts.length;
  }

  prevFeaturedProducts(): void {
    if (!this.canSlideFeaturedProducts()) {
      return;
    }
    this.featuredStartIndex = (this.featuredStartIndex - 1 + this.featuredProducts.length) % this.featuredProducts.length;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateFeaturedVisibleCount();
  }

  private updateFeaturedVisibleCount(): void {
    const width = window.innerWidth;
    if (width <= 768) {
      this.featuredVisibleCount = 1;
    } else if (width <= 992) {
      this.featuredVisibleCount = 2;
    } else {
      this.featuredVisibleCount = 3;
    }
    if (this.featuredStartIndex >= this.featuredProducts.length) {
      this.featuredStartIndex = 0;
    }
  }

  canAddFeaturedToCart(item: FeaturedProduct): boolean {
    return this.isClient() && !!item.variantId && item.availableStock > 0;
  }

  addFeaturedToCart(item: FeaturedProduct): void {
    if (!this.canAddFeaturedToCart(item) || !item.variantId) {
      return;
    }
    this.featuredProductsSuccessMessage = null;
    this.featuredProductsErrorMessage = null;
    this.cartService.addItem(item.variantId, 1).subscribe({
      next: () => {
        this.featuredProductsSuccessMessage = `${item.name} ajouté au panier.`;
        setTimeout(() => (this.featuredProductsSuccessMessage = null), 3000);
      },
      error: (err) => {
        this.featuredProductsErrorMessage = err?.error?.message || 'Erreur lors de l\'ajout au panier.';
        setTimeout(() => (this.featuredProductsErrorMessage = null), 5000);
      }
    });
  }

  isFilledStar(rating: number | null, star: number): boolean {
    if (rating == null) {
      return false;
    }
    return star <= Math.round(rating);
  }

  nextSlide(): void {
    if (!this.banners.length) {
      return;
    }
    this.currentSlide = (this.currentSlide + 1) % this.banners.length;
  }

  prevSlide(): void {
    if (!this.banners.length) {
      return;
    }
    this.currentSlide = (this.currentSlide - 1 + this.banners.length) % this.banners.length;
  }

  goToSlide(index: number): void {
    if (index < 0 || index >= this.banners.length) {
      return;
    }
    this.currentSlide = index;
  }

  private startAutoSlide(): void {
    this.stopAutoSlide();
    if (this.banners.length <= 1) {
      return;
    }
    this.sliderTimer = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  private stopAutoSlide(): void {
    if (this.sliderTimer) {
      clearInterval(this.sliderTimer);
      this.sliderTimer = null;
    }
  }
}

