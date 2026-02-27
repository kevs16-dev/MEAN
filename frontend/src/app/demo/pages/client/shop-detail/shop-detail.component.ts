import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IconDirective } from '@ant-design/icons-angular';
import { ShopService } from '../../../../service/shop.service';

@Component({
  selector: 'app-shop-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, IconDirective],
  templateUrl: './shop-detail.component.html',
  styleUrls: ['./shop-detail.component.scss']
})
export class ShopDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private shopService = inject(ShopService);

  shop: any = null;
  isLoading = true;
  error: string | null = null;

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
      },
      error: (err) => {
        this.error = err?.error?.message || 'Boutique introuvable.';
        this.shop = null;
        this.isLoading = false;
      }
    });
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
