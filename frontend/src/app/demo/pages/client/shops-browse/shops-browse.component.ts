import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../theme/shared/shared.module';
import { ShopService } from '../../../../service/shop.service';
import { CategoryService } from '../../../../service/category.service';

@Component({
  selector: 'app-shops-browse',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './shops-browse.component.html',
  styleUrls: ['./shops-browse.component.scss']
})
export class ShopsBrowseComponent implements OnInit, AfterViewInit {
  private shopService = inject(ShopService);
  private categoryService = inject(CategoryService);

  shops: any[] = [];
  filteredShops: any[] = [];
  categories: any[] = [];
  isLoading = true;
  error: string | null = null;

  selectedCategory: string = 'all';
  searchTerm: string = '';

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loadCategories();
      this.loadShops();
    }, 0);
  }

  loadShops(): void {
    this.isLoading = true;
    this.shopService.getShops().subscribe({
      next: (data) => {
        const body: any = data;
        const list = Array.isArray(body)
          ? body
          : Array.isArray(body?.shops)
          ? body.shops
          : Array.isArray(body?.data)
          ? body.data
          : [];
        const activeShops = list.filter((s: any) => s.status === 'ACTIVE');
        setTimeout(() => {
          this.shops = activeShops;
          this.applyFilters();
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

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        const body: any = data;
        const list = Array.isArray(body)
          ? body
          : Array.isArray(body?.categories)
          ? body.categories
          : Array.isArray(body?.data)
          ? body.data
          : [];
        this.categories = list.filter((c: any) => c.status === 'ACTIVE');
      },
      error: () => {}
    });
  }

  onCategoryChange(): void {
    setTimeout(() => this.applyFilters(), 0);
  }

  onSearch(): void {
    setTimeout(() => this.applyFilters(), 0);
  }

  applyFilters(): void {
    let filtered = [...this.shops];

    // Filtre par catégorie
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter((shop) => {
        const categoryId = typeof shop.category === 'object' ? shop.category?._id : shop.category;
        return categoryId === this.selectedCategory;
      });
    }

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((shop) => {
        const values = [
          shop?.name,
          shop?.slug,
          shop?.description,
          shop?.category?.name,
          shop?.location?.floor,
          shop?.location?.block
        ];
        return values.some((v) => v && v.toString().toLowerCase().includes(term));
      });
    }

    this.filteredShops = filtered;
  }

  getCategoryName(shop: any): string {
    if (typeof shop.category === 'object' && shop.category?.name) {
      return shop.category.name;
    }
    const cat = this.categories.find((c) => c._id === shop.category);
    return cat?.name || 'Non catégorisé';
  }

  getShopImage(shop: any): string {
    return shop?.coverImage || shop?.logo || 'assets/images/shop-placeholder.jpg';
  }

  getLocationString(shop: any): string {
    const parts: string[] = [];
    if (shop?.location?.floor) parts.push(`Étage ${shop.location.floor}`);
    if (shop?.location?.block) parts.push(`Bloc ${shop.location.block}`);
    return parts.length > 0 ? parts.join(' • ') : 'Centre commercial';
  }
}
