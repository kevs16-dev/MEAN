// project import
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

import { AuthService } from '../../../../service/auth.service';

@Component({
  selector: 'app-auth-login',
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './auth-login.component.html',
  styleUrl: './auth-login.component.scss'
})
export class AuthLoginComponent {
  email = '';
  password = '';
  rememberMe = '';
  message = '';
  loading = false;
  alertType: string = 'alert-danger';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get canSubmit() : boolean {
    return !!this.email && !!this.password;
  }

  submit(form: { valid?: boolean }) : void {
    if (!this.canSubmit || this.loading) return;

    this.loading = true;
    this.message = '';

    this.authService.connexion({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        const role = res?.user?.role;
        let targetRoute = '/dashboard/default';

        if (role === 'CLIENT') {
          targetRoute = '/client/home';
        } else if (role === 'ADMIN') {
          targetRoute = '/admin/home';
        } else if (role === 'BOUTIQUE') {
          targetRoute = '/boutique/home';
        }

        this.message = 'Connexion réussie. Redirection…';
        this.alertType = 'alert-success';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate([targetRoute]), 1200);
      },
      error: err => {
        this.message = err.error.message;
        this.alertType = 'alert-error';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private roleCredentials: Record<string, { email: string; password: string }> = {
    admin: { email: 'admin@gmail.com', password: 'admin2026-MEAN' },
    boutique: { email: 'boutique1@gmail.com', password: 'boutique2026-MEAN' },
    client: { email: 'client1@gmail.com', password: 'client2026-MEAN' }
  };

  fillAndLogin(role: 'admin' | 'boutique' | 'client'): void {
    const creds = this.roleCredentials[role];
    if (!creds) return;
    this.email = creds.email;
    this.password = creds.password;
    this.submit({ valid: true });
  }
}
