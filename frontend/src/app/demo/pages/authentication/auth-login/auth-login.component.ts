// project import
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

import { AuthService } from '../../../../service/auth.service';
import { Console } from 'console';

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
      next: () => {
        this.message = 'Connexion réussie. Redirection…';
        this.alertType = 'alert-success';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: err => {
        this.message = err.error.message;
        this.alertType = 'alert-error';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  SignInOptions = [
    {
      image: 'assets/images/authentication/google.svg',
      name: 'Google'
    },
    {
      image: 'assets/images/authentication/twitter.svg',
      name: 'Twitter'
    },
    {
      image: 'assets/images/authentication/facebook.svg',
      name: 'Facebook'
    }
  ];
}
