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
  serverError: string | null = null;

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoadingCategories = false;
      },
      error: () => {
        this.isLoadingCategories = false;
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

