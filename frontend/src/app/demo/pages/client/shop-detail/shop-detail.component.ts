import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IconDirective } from '@ant-design/icons-angular';
import { ShopService } from '../../../../service/shop.service';
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
  private reviewService = inject(ReviewService);
  private authService = inject(AuthService);

  shop: any = null;
  isLoading = true;
  error: string | null = null;

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

  goBack(): void {
    this.router.navigate(['/client/shops']);
  }

  goToProducts(): void {
    if (this.shop?._id) {
      this.router.navigate(['/client/shops', this.shop._id, 'products']);
    }
  }
}
