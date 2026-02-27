import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoryService } from '../../service/category.service';
import { ShopService } from '../../service/shop.service';
import { CardComponent } from '../../theme/shared/components/card/card.component';

@Component({
  selector: 'app-shop-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent],
  templateUrl: './shop-form.component.html',
  styleUrls: ['./shop-form.component.scss']
})
export class ShopFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private shopService = inject(ShopService);
  readonly router = inject(Router);

  shopForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    slug: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    category: ['', Validators.required],
    logo: [''],
    coverImage: [''],
    contact: this.fb.group({
      phone: [''],
      email: ['', Validators.email]
    }),
    location: this.fb.group({
      floor: [''],
      block: ['']
    }),
    openingHours: this.fb.group({
      monday: [''],
      tuesday: [''],
      wednesday: [''],
      thursday: [''],
      friday: [''],
      saturday: [''],
      sunday: ['']
    }),
    status: ['ACTIVE', Validators.required]
  });

  categories: any[] = [];
  isLoadingCategories = false;
  isSubmitting = false;
  isUploadingLogo = false;
  isUploadingCover = false;
  logoUploadError: string | null = null;
  coverUploadError: string | null = null;
  serverError: string | null = null;

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoryService.getCategories().subscribe({
      next: (resp) => {
        this.categories = Array.isArray(resp)
          ? resp
          : Array.isArray((resp as any)?.categories)
          ? (resp as any).categories
          : [];
        this.isLoadingCategories = false;
      },
      error: () => {
        this.isLoadingCategories = false;
      }
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploadingLogo = true;
    this.logoUploadError = null;

    this.shopService.uploadImage(file).subscribe({
      next: (resp) => {
        this.shopForm.patchValue({ logo: resp?.imageUrl || '' });
        this.isUploadingLogo = false;
      },
      error: (err) => {
        this.isUploadingLogo = false;
        this.logoUploadError = err?.error?.message || 'Échec de l’upload du logo.';
      }
    });
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploadingCover = true;
    this.coverUploadError = null;

    this.shopService.uploadImage(file).subscribe({
      next: (resp) => {
        this.shopForm.patchValue({ coverImage: resp?.imageUrl || '' });
        this.isUploadingCover = false;
      },
      error: (err) => {
        this.isUploadingCover = false;
        this.coverUploadError = err?.error?.message || 'Échec de l’upload de l’image de couverture.';
      }
    });
  }

  onSubmit(): void {
    if (this.shopForm.invalid || this.isSubmitting) {
      this.shopForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.serverError = null;

    const payload = this.shopForm.value;

    this.shopService.createShop(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/boutique/home']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.serverError = err?.error?.message || 'Une erreur est survenue lors de la création de la boutique.';
      }
    });
  }
}

