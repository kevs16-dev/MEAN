import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CardComponent } from '../../theme/shared/components/card/card.component';
import { ProductService } from '../../service/product.service';

@Component({
  selector: 'app-boutique-products-list',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss']
})
export class ProductsListComponent implements OnInit, AfterViewInit {
  private productService = inject(ProductService);
  readonly router = inject(Router);

  products: any[] = [];
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => this.loadProducts(), 0);
  }

  loadProducts(): void {
    this.productService.getMyProducts().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        setTimeout(() => {
          this.products = list;
          this.isLoading = false;
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.error = 'Impossible de charger les produits.';
          this.isLoading = false;
        }, 0);
      }
    });
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

