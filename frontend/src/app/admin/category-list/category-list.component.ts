import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CardComponent } from '../../theme/shared/components/card/card.component';
import { CategoryService } from '../../service/category.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent implements OnInit, AfterViewInit {
  private categoryService = inject(CategoryService);
  readonly router = inject(Router);

  categories: any[] = [];
  filteredCategories: any[] = [];
  isLoading = true;
  error: string | null = null;

  page = 1;
  pageSize = 10;
  searchTerm = '';

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Démarre le chargement après le premier cycle de détection
    setTimeout(() => this.loadCategories(), 0);
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
        // Décaler la mise à jour à la prochaine macrotâche
        setTimeout(() => {
          this.categories = list;
          this.applyFilter(this.searchTerm);
          this.isLoading = false;
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.error = 'Impossible de charger les catégories.';
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
    const source = Array.isArray(this.categories) ? this.categories : [];

    if (!t) {
      this.filteredCategories = source.slice();
    } else {
      this.filteredCategories = source.filter((c) => {
        const values = [c?.name, c?.slug, c?.description, c?.status];
        return values.some((v) => v && v.toString().toLowerCase().includes(t));
      });
    }
    this.page = 1;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCategories.length / this.pageSize));
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

  get paginatedCategories(): any[] {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredCategories.slice(start, end);
  }
}

