// Angular import
import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../../../service/auth.service';

@Component({
  selector: 'app-auth-register',
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './auth-register.component.html',
  styleUrls: ['./auth-register.component.scss']
})
export class AuthRegisterComponent implements AfterViewInit {
  username = '';
  email = '';
  password = '';
  passwordConfirm = '';
  message = '';
  loading = false;
  alertType: string = 'alert-success';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    // Plus de captcha à gérer
  }

  get passwordStrength(): number {
    const p = this.password || '';
    let score = 0;
    if (p.length >= 8) score++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    return Math.min(score, 4);
  }

  get passwordStrengthLabel(): string {
    const labels = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];
    return labels[this.passwordStrength];
  }

  get passwordRules(): { label: string; ok: boolean }[] {
    const p = this.password || '';
    return [
      { label: 'Au moins 8 caractères', ok: p.length >= 8 },
      { label: 'Une majuscule et une minuscule', ok: /[a-z]/.test(p) && /[A-Z]/.test(p) },
      { label: 'Un chiffre', ok: /\d/.test(p) },
      { label: 'Un caractère spécial', ok: /[^a-zA-Z0-9]/.test(p) }
    ];
  }

  get passwordsMatch(): boolean {
    return !!this.password && this.password === this.passwordConfirm;
  }

  get isPasswordStrong(): boolean {
    return this.passwordRules.every(r => r.ok);
  }

  get canSubmit(): boolean {
    return !!this.username && !!this.email && !!this.password && this.passwordsMatch && this.isPasswordStrong;
  }

  submit(form: { valid?: boolean }): void {
    if (!this.canSubmit || this.loading) return;

    if (this.password !== this.passwordConfirm) {
      this.message = 'Les mots de passe ne correspondent pas';
      this.alertType = 'alert-error';
      this.cdr.detectChanges();
      return;
    }

    if (!this.isPasswordStrong) {
      this.message = 'Le mot de passe ne respecte pas tous les critères de sécurité';
      this.alertType = 'alert-error';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.message = '';

    this.authService.inscription({
      username: this.username,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.message = 'Compte créé avec succès. Redirection…';
        this.alertType = 'alert-success';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: err => {
        this.message = err.error?.message ?? 'Erreur lors de l\'inscription';
        this.alertType = 'alert-error';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  SignUpOptions = [
    { image: 'assets/images/authentication/google.svg', name: 'Google' },
    { image: 'assets/images/authentication/twitter.svg', name: 'Twitter' },
    { image: 'assets/images/authentication/facebook.svg', name: 'Facebook' }
  ];
}