import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { ReviewService, type Review } from '../../../../service/review.service';
import { UserService } from '../../../../service/user.service';

@Component({
  selector: 'app-boutique-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  templateUrl: './boutique-reviews.component.html',
  styleUrls: ['./boutique-reviews.component.scss']
})
export class BoutiqueReviewsComponent implements OnInit {
  private reviewService = inject(ReviewService);
  private userService = inject(UserService);

  isLoading = true;
  error: string | null = null;
  shopId: string | null = null;
  reviews: Review[] = [];
  averageRating: number | null = null;
  totalCount = 0;

  ngOnInit(): void {
    const user = this.userService.getUtilisateur();
    const rawShopId = user?.shopId;
    this.shopId = typeof rawShopId === 'string' ? rawShopId : rawShopId?._id || null;

    if (!this.shopId) {
      this.error = 'Aucune boutique associée à ce compte.';
      this.isLoading = false;
      return;
    }

    this.loadReviews();
  }

  loadReviews(): void {
    if (!this.shopId) return;
    this.isLoading = true;
    this.error = null;
    this.reviewService.getShopReviews(this.shopId, 1, 50).subscribe({
      next: (res) => {
        this.reviews = Array.isArray(res?.reviews) ? res.reviews : [];
        this.averageRating = res?.averageRating ?? null;
        this.totalCount = Number(res?.totalCount ?? res?.total ?? 0);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Impossible de charger les avis de votre boutique.';
        this.reviews = [];
        this.averageRating = null;
        this.totalCount = 0;
        this.isLoading = false;
      }
    });
  }

  isFilledStar(rating: number | null, star: number): boolean {
    if (rating == null) return false;
    return star <= Math.round(rating);
  }

  getReviewAuthorName(r: Review): string {
    const u = r.userId;
    if (!u) return 'Anonyme';
    const fullName = [u.prenom, u.nom].filter(Boolean).join(' ').trim();
    return fullName || u.username || 'Anonyme';
  }
}

