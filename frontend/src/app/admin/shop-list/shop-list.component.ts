import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CardComponent } from '../../theme/shared/components/card/card.component';
import { ShopService } from '../../service/shop.service';
import { SharedModule } from '../../theme/shared/shared.module';

@Component({
  selector: 'app-shop-list',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, SharedModule],
  templateUrl: './shop-list.component.html',
  styleUrls: ['./shop-list.component.scss']
})
export class ShopListComponent implements OnInit, AfterViewInit {
  private shopService = inject(ShopService);
  readonly router = inject(Router);

  shops: any[] = [];
  filteredShops: any[] = [];
  selectedShop: any | null = null;
  isLoading = true;
  isDeleting = false;
  error: string | null = null;

  page = 1;
  pageSize = 10;
  searchTerm = '';

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Démarre le chargement après le premier cycle de détection
    setTimeout(() => this.loadShops(), 0);
  }

  loadShops(): void {
    this.shopService.getShops().subscribe({
      next: (data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.data)
          ? (data as any).data
          : [];
        setTimeout(() => {
          this.shops = list;
          this.applyFilter(this.searchTerm);
          this.isLoading = false;
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.error = 'Impossible de charger les boutiques.';
          this.isLoading = false;
        }, 0);
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilter(term);
  }

  applyFilter(term: string): void {
    const t = term.toLowerCase().trim();
    const source = Array.isArray(this.shops) ? this.shops : [];

    if (!t) {
      this.filteredShops = source.slice();
    } else {
      this.filteredShops = source.filter((s) => {
        const values = [
          s?.name,
          s?.slug,
          s?.description,
          s?.status,
          s?.category?.name
        ];
        return values.some((v) => v && v.toString().toLowerCase().includes(t));
      });
    }
    this.page = 1;

    if (this.selectedShop) {
      const stillVisible = this.filteredShops.some((s) => s?._id === this.selectedShop?._id);
      if (!stillVisible) {
        this.selectedShop = null;
      }
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredShops.length / this.pageSize));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.page = page;
  }

  get paginatedShops(): any[] {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredShops.slice(start, end);
  }

  toggleDetails(shop: any): void {
    this.selectedShop = shop;
  }

  closeDetails(): void {
    this.selectedShop = null;
  }

  deleteShop(shop: any): void {
    if (!shop?._id || this.isDeleting) {
      return;
    }

    const confirmed = window.confirm(`Supprimer la boutique "${shop.name}" ?`);
    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.error = null;

    this.shopService.deleteShop(shop._id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.shops = this.shops.filter((s) => s?._id !== shop._id);
        this.applyFilter(this.searchTerm);
        if (this.selectedShop?._id === shop._id) {
          this.selectedShop = null;
        }
      },
      error: (err) => {
        this.isDeleting = false;
        this.error = err?.error?.message || 'Impossible de supprimer la boutique.';
      }
    });
  }
}

