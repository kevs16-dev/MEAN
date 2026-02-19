import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoryService } from '../../service/category.service';
import { CardComponent } from '../../theme/shared/components/card/card.component';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss']
})
export class CategoryFormComponent {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  readonly router = inject(Router);

  categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    slug: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    icon: [''],
    status: ['ACTIVE', [Validators.required]]
  });

  isSubmitting = false;
  serverError: string | null = null;

  onSubmit(): void {
    if (this.categoryForm.invalid || this.isSubmitting) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.serverError = null;

    const payload = this.categoryForm.value;

    this.categoryService.createCategory(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/admin/home']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.serverError = err?.error?.message || 'Une erreur est survenue lors de la création de la catégorie.';
      }
    });
  }
}
