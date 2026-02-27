// Angular import
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Project import
import { BannerService } from '../../../service/banner.service';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-home.component.html',
  styleUrls: ['./client-home.component.scss']
})
export class ClientHomeComponent implements OnInit, OnDestroy {
  private bannerService = inject(BannerService);

  banners: any[] = [];
  currentSlide = 0;
  private sliderTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadBanners();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  loadBanners(): void {
    this.bannerService.getBanners().subscribe({
      next: (resp) => {
        this.banners = Array.isArray(resp?.banners) ? resp.banners : [];
        this.currentSlide = 0;
        this.startAutoSlide();
      },
      error: () => {
        this.banners = [];
      }
    });
  }

  nextSlide(): void {
    if (!this.banners.length) {
      return;
    }
    this.currentSlide = (this.currentSlide + 1) % this.banners.length;
  }

  prevSlide(): void {
    if (!this.banners.length) {
      return;
    }
    this.currentSlide = (this.currentSlide - 1 + this.banners.length) % this.banners.length;
  }

  goToSlide(index: number): void {
    if (index < 0 || index >= this.banners.length) {
      return;
    }
    this.currentSlide = index;
  }

  private startAutoSlide(): void {
    this.stopAutoSlide();
    if (this.banners.length <= 1) {
      return;
    }
    this.sliderTimer = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  private stopAutoSlide(): void {
    if (this.sliderTimer) {
      clearInterval(this.sliderTimer);
      this.sliderTimer = null;
    }
  }
}

