import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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

  readonly minStartDate = this.toDateTimeLocalValue(new Date());

  eventForm: FormGroup = this.fb.group(
    {
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      location: [''],
      targetRoles: [[], Validators.required],
      status: ['DRAFT', Validators.required],
      createNotification: [true],
      reminderDaysBefore: [0, [Validators.required, Validators.min(0), Validators.max(365)]]
    },
    { validators: this.dateRangeValidator }
  );

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

  get minEndDate(): string {
    return this.eventForm.get('startDate')?.value || this.minStartDate;
  }

  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const startRaw = control.get('startDate')?.value;
    const endRaw = control.get('endDate')?.value;
    if (!startRaw || !endRaw) {
      return null;
    }

    const now = new Date();
    const startDate = new Date(startRaw);
    const endDate = new Date(endRaw);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return { invalidDate: true };
    }

    if (startDate < now) {
      return { startDateInPast: true };
    }

    if (endDate < startDate) {
      return { endBeforeStart: true };
    }

    return null;
  }

  private toDateTimeLocalValue(date: Date): string {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  onSubmit(): void {
    if (this.eventForm.invalid || this.isSubmitting) {
      this.eventForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.serverError = null;

    const payload = {
      ...this.eventForm.value,
      reminderDaysBefore: Number(this.eventForm.value.reminderDaysBefore ?? 0)
    };

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