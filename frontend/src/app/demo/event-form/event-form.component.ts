import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService } from '../../service/event.service';
import { CardComponent } from '../../theme/shared/components/card/card.component';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent],
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.scss']
})
export class EventFormComponent {

  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  readonly router = inject(Router);

  eventForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    location: [''],
    targetRoles: [[], Validators.required],
    status: ['DRAFT', Validators.required]
  });

  roles = [
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Boutique', value: 'BOUTIQUE' },
    { label: 'Client', value: 'CLIENT' },
    { label: 'Tous', value: 'ALL' }
  ];

  statuses = [
    { label: 'Brouillon', value: 'DRAFT' },
    { label: 'Publié', value: 'PUBLISHED' }
  ];

  isSubmitting = false;
  serverError: string | null = null;

  onSubmit(): void {
    if (this.eventForm.invalid || this.isSubmitting) {
      this.eventForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.serverError = null;

    const payload = this.eventForm.value;

    this.eventService.createEvent(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.serverError =
          err?.error?.message ||
          'Une erreur est survenue lors de la création de l’évènement.';
      }
    });
  }
}