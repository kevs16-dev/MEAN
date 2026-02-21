import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../service/notification.service';
import { CardComponent } from '../../theme/shared/components/card/card.component';

@Component({
  selector: 'app-notification-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent],
  templateUrl: './notification-form.component.html',
  styleUrls: ['./notification-form.component.scss']
})
export class NotificationFormComponent {

  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  readonly router = inject(Router);

  notificationForm: FormGroup = this.fb.group({
    role: [[], Validators.required],
    title: ['', [Validators.maxLength(255)]],
    message: ['', Validators.required],
    type: ['INFO', Validators.required]
  });

  roles = [
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Boutique', value: 'BOUTIQUE' },
    { label: 'Client', value: 'CLIENT' },
    { label: 'Tous', value: 'ALL' }
  ];

  types = ['INFO', 'SUCCESS', 'WARNING', 'ALERT', 'ERROR'];

  isSubmitting = false;
  serverError: string | null = null;

  onSubmit(): void {
    if (this.notificationForm.invalid || this.isSubmitting) {
      this.notificationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.serverError = null;

    const payload = this.notificationForm.value;

    this.notificationService.createForRole(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/admin/home']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.serverError =
          err?.error?.message ||
          'Une erreur est survenue lors de l’envoi de la notification.';
      }
    });
  }
}