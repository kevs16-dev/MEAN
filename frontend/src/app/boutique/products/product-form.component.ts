import { Component, OnInit, AfterViewInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CardComponent } from '../../theme/shared/components/card/card.component';
import { ProductService } from '../../service/product.service';

@Component({
  selector: 'app-boutique-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CardComponent],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit, AfterViewInit {
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);

  editMode = false;
  productId: string | null = null;

  name = '';
  description = '';
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' = 'ACTIVE';

   
  images: { url: string; isPrimary: boolean }[] = [];

  
  variants: {
    _id?: string;
    attributes: { name: string; value: string }[];
    sku?: string;
    currentPrice: number;
    stock: number;
    lowStockAlertThreshold: number;
    isActive: boolean;
  }[] = [];

  loading = false;
  message = '';
  alertType: 'alert-success' | 'alert-error' = 'alert-success';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.editMode = true;
        this.productId = id;
        this.loadProduct(id);
        this.loadVariants(id);
      }
    });
  }

  ngAfterViewInit(): void {}

  loadProduct(id: string): void {
    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: (p) => {
        if (p) {
          this.name = p.name || '';
          this.description = p.description || '';
          this.status = p.status || 'ACTIVE';
          this.images = Array.isArray(p.images)
            ? p.images.map((img: any) => ({
                url: img.url || '',
                isPrimary: !!img.isPrimary
              }))
            : [];
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.message = err.error?.message || 'Erreur lors du chargement du produit.';
        this.alertType = 'alert-error';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadVariants(productId: string): void {
    this.productService.getVariants(productId).subscribe({
      next: (list) => {
        this.variants = Array.isArray(list)
          ? list.map((v: any) => ({
              _id: v._id,
              attributes: Array.isArray(v.attributes)
                ? v.attributes.map((a: any) => ({
                    name: a?.name || '',
                    value: a?.value || ''
                  }))
                : [],
              sku: v.sku || '',
              currentPrice: v.currentPrice ?? 0,
              stock: v.stock ?? 0,
              lowStockAlertThreshold: v.lowStockAlertThreshold ?? 5,
              isActive: v.isActive ?? true
            }))
          : [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.variants = [];
        this.cdr.detectChanges();
      }
    });
  }

  addImage(): void {
    this.images.push({ url: '', isPrimary: this.images.length === 0 });
  }

  removeImage(index: number): void {
    this.images.splice(index, 1);
    if (!this.images.some((img) => img.isPrimary) && this.images[0]) {
      this.images[0].isPrimary = true;
    }
  }

  setPrimaryImage(index: number): void {
    this.images = this.images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
  }

  addVariant(): void {
    this.variants.push({
      attributes: [],
      sku: '',
      currentPrice: 0,
      stock: 0,
      lowStockAlertThreshold: 5,
      isActive: true
    });
  }

  removeVariant(index: number): void {
    const variant = this.variants[index];
    if (this.editMode && this.productId && variant._id) {
      this.productService.deleteVariant(this.productId, variant._id).subscribe({
        next: () => {
          this.variants.splice(index, 1);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.message = err.error?.message || 'Erreur lors de la suppression de la variante.';
          this.alertType = 'alert-error';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.variants.splice(index, 1);
    }
  }

  canSubmit(): boolean {
    return !!this.name && !this.loading;
  }

  submit(): void {
    if (!this.canSubmit()) return;

    this.loading = true;
    this.message = '';

    const payload: any = {
      name: this.name,
      description: this.description,
      status: this.status,
      images: this.images
    };

    if (this.editMode && this.productId) {
      this.productService.updateProduct(this.productId, payload).subscribe({
        next: () => {
          this.saveVariants(this.productId!);
        },
        error: (err) => {
          this.message = err.error?.message || 'Erreur lors de la mise à jour du produit.';
          this.alertType = 'alert-error';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.productService.createProduct(payload).subscribe({
        next: (resp) => {
          const created = resp?.product || resp;
          const id = created?._id;
          if (id) {
            this.saveVariants(id);
          } else {
            this.message = 'Produit créé, mais identifiant introuvable.';
            this.alertType = 'alert-error';
            this.loading = false;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.message = err.error?.message || 'Erreur lors de la création du produit.';
          this.alertType = 'alert-error';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  private saveVariants(productId: string): void {
    const requests = this.variants.map((v) => {
      const data = {
        attributes: Array.isArray(v.attributes)
          ? v.attributes
              .filter((a) => a && (a.name || a.value))
              .map((a) => ({
                name: a.name || '',
                value: a.value || ''
              }))
          : [],
        sku: v.sku || '',
        currentPrice: v.currentPrice ?? 0,
        stock: v.stock ?? 0,
        lowStockAlertThreshold: v.lowStockAlertThreshold ?? 5,
        isActive: v.isActive ?? true
      };

      if (v._id) {
        return this.productService.updateVariant(productId, v._id, data);
      }
      return this.productService.createVariant(productId, data);
    });

    if (requests.length === 0) {
      this.onSaveSuccess();
      return;
    }

    let done = 0;
    let hasError = false;

    requests.forEach((obs) => {
      obs.subscribe({
        next: () => {
          done++;
          if (done === requests.length && !hasError) {
            this.onSaveSuccess();
          }
        },
        error: (err) => {
          hasError = true;
          this.message = err.error?.message || 'Erreur lors de l\'enregistrement des variantes.';
          this.alertType = 'alert-error';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  private onSaveSuccess(): void {
    this.message = this.editMode
      ? 'Produit mis à jour avec succès.'
      : 'Produit créé avec succès.';
    this.alertType = 'alert-success';
    this.loading = false;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.router.navigate(['/boutique/products']);
    }, 1000);
  }
}

