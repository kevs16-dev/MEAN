import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CardComponent } from '../../theme/shared/components/card/card.component';
import { ProductService } from '../../service/product.service';

@Component({
  selector: 'app-product-view',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  templateUrl: './product-view.component.html',
  styleUrls: ['./product-view.component.scss']
})
export class ProductViewComponent implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  product: any = null;
  variants: any[] = [];
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Identifiant produit manquant.';
      this.isLoading = false;
      return;
    }
    this.productService.getMyProductWithVariants(id).subscribe({
      next: (res) => {
        this.product = res.product ?? null;
        this.variants = Array.isArray(res.variants) ? res.variants : [];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Impossible de charger le produit.';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/boutique/products']);
  }

  goToEdit(): void {
    if (this.product?._id) {
      this.router.navigate(['/boutique/products/edit', this.product._id]);
    }
  }

  getProductImageUrl(p: any): string | null {
    const images = p?.images;
    if (!Array.isArray(images) || images.length === 0) return null;
    const primary = images.find((img: any) => img?.isPrimary && img?.url);
    if (primary?.url) return primary.url;
    return images[0]?.url || null;
  }
}
