import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../theme/shared/components/card/card.component';
import { BannerService } from '../../service/banner.service';

@Component({
  selector: 'app-banner-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './banner-list.component.html',
  styleUrls: ['./banner-list.component.scss']
})
export class BannerListComponent implements OnInit {
  private bannerService = inject(BannerService);

  banners: any[] = [];
  selectedFile: File | null = null;
  title = '';
  displayOrder = 0;

  isLoading = false;
  isSubmitting = false;
  message: string | null = null;
  error: string | null = null;

  ngOnInit(): void {
    this.loadBanners();
  }

  loadBanners(): void {
    this.isLoading = true;
    this.error = null;

    this.bannerService.getBanners(true).subscribe({
      next: (resp) => {
        this.banners = Array.isArray(resp?.banners) ? resp.banners : [];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Impossible de charger les bannières.';
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedFile = file;
  }

  uploadBanner(): void {
    if (!this.selectedFile || this.isSubmitting) {
      this.error = 'Veuillez sélectionner une image.';
      return;
    }

    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('title', this.title.trim());
    formData.append('displayOrder', String(this.displayOrder || 0));

    this.isSubmitting = true;
    this.error = null;
    this.message = null;

    this.bannerService.createBanner(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.message = 'Bannière uploadée avec succès.';
        this.selectedFile = null;
        this.title = '';
        this.displayOrder = 0;
        this.loadBanners();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err?.error?.message || 'Échec de l’upload de la bannière.';
      }
    });
  }

  deleteBanner(id: string): void {
    if (!id || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    this.message = null;

    this.bannerService.deleteBanner(id).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.message = 'Bannière supprimée.';
        this.loadBanners();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err?.error?.message || 'Impossible de supprimer la bannière.';
      }
    });
  }
}
