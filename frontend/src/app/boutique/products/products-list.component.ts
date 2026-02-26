import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { CardComponent } from '../../theme/shared/components/card/card.component';
import { ProductService } from '../../service/product.service';

@Component({
  selector: 'app-boutique-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CardComponent],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss']
})
export class ProductsListComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private router = inject(Router);

  products: any[] = [];
  isLoading = true;
  error: string | null = null;

  page = 1;
  limit = 10;
  limits = [5, 10, 20];
  total = 0;
  searchTerm = '';

  private filterChanged$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
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
    this.isLoading = true;
    this.error = null;
    this.productService
      .getMyProducts({
        page: this.page,
        limit: this.limit,
        search: this.searchTerm || undefined
      })
      .subscribe({
        next: (res) => {
          this.products = Array.isArray(res.products) ? res.products : [];
          this.total = typeof res.total === 'number' ? res.total : 0;
          if (res.page != null) this.page = res.page;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Impossible de charger les produits.';
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

  goToCreate(): void {
    this.router.navigate(['/boutique/products/new']);
  }

  goToEdit(id: string): void {
    this.router.navigate(['/boutique/products/edit', id]);
  }

  getProductImageUrl(product: any): string | null {
    const images = product?.images;
    if (!Array.isArray(images) || images.length === 0) return null;
    const primary = images.find((img: any) => img?.isPrimary && img?.url);
    if (primary?.url) return primary.url;
    return images[0]?.url || null;
  }
}
