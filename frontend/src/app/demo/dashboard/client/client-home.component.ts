// Angular import
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

// Project import
import { BannerService } from '../../../service/banner.service';
import { FeaturedService, FeaturedVariant } from '../../../service/featured.service';

export type SlideItem = { type: 'banner'; data: any } | { type: 'featured'; data: FeaturedVariant };

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-home.component.html',
  styleUrls: ['./client-home.component.scss']
})
export class ClientHomeComponent implements OnInit, OnDestroy {
  private bannerService = inject(BannerService);
  private featuredService = inject(FeaturedService);

  slides: SlideItem[] = [];
  currentSlide = 0;
  private sliderTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadSlides();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  loadSlides(): void {
    forkJoin({
      featured: this.featuredService.getBestSellingVariant(),
      banners: this.bannerService.getBanners()
    }).subscribe({
      next: ({ featured, banners }) => {
        const f = featured?.featured ?? null;
        const b = Array.isArray(banners?.banners) ? banners.banners : [];
        this.slides = [];
        if (f) this.slides.push({ type: 'featured', data: f });
        b.forEach((item) => this.slides.push({ type: 'banner', data: item }));
        this.currentSlide = 0;
        this.startAutoSlide();
      },
      error: () => {
        this.slides = [];
        this.currentSlide = 0;
      }
    });
  }

  nextSlide(): void {
    if (!this.slides.length) return;
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    if (!this.slides.length) return;
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(index: number): void {
    if (index < 0 || index >= this.slides.length) return;
    this.currentSlide = index;
  }

  getFeaturedImageUrl(item: FeaturedVariant): string {
    const v = item.variant;
    const imgs = item.product?.images ?? [];
    if (v?.imageUrl) return v.imageUrl;
    const primary = imgs.find((i) => i.isPrimary);
    return primary?.url || imgs[0]?.url || '';
  }

  getProductUrl(item: FeaturedVariant): string[] {
    const shopId = item.shop?._id;
    const productId = item.product?._id;
    if (!shopId || !productId) return ['/client/shops'];
    return ['/client/shops', shopId, 'products', productId];
  }

  private startAutoSlide(): void {
    this.stopAutoSlide();
    if (this.slides.length <= 1) return;
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

