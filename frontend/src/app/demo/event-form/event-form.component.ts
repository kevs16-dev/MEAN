import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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
export class EventFormComponent implements OnDestroy {

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
      isPrivate: [false],
      ticketTypes: this.fb.array([]),
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
  private isPrivateSubscription = this.eventForm.get('isPrivate')?.valueChanges.subscribe((isPrivate) => {
    this.updatePrivateEventValidators(!!isPrivate);
  });

  constructor() {
    this.updatePrivateEventValidators(!!this.eventForm.get('isPrivate')?.value);
  }

  get minEndDate(): string {
    return this.eventForm.get('startDate')?.value || this.minStartDate;
  }

  get ticketTypes(): FormArray {
    return this.eventForm.get('ticketTypes') as FormArray;
  }

  addTicketType(): void {
    this.ticketTypes.push(this.createTicketTypeGroup());
    this.ticketTypes.markAsTouched();
  }

  removeTicketType(index: number): void {
    if (this.ticketTypes.length <= 1) {
      return;
    }
    this.ticketTypes.removeAt(index);
    this.ticketTypes.markAsTouched();
  }

  private createTicketTypeGroup(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      maxPlaces: [null, [Validators.required, Validators.min(1)]],
      paf: [null, [Validators.required, Validators.min(0)]]
    });
  }

  private clearTicketTypes(): void {
    while (this.ticketTypes.length) {
      this.ticketTypes.removeAt(0);
    }
  }

  private atLeastOneTicketTypeValidator(control: AbstractControl): ValidationErrors | null {
    const ticketTypeArray = control as FormArray;
    return ticketTypeArray.length > 0 ? null : { required: true };
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

  private updatePrivateEventValidators(isPrivate: boolean): void {
    if (isPrivate) {
      this.ticketTypes.setValidators([this.atLeastOneTicketTypeValidator]);
      if (this.ticketTypes.length === 0) {
        this.addTicketType();
      }
    } else {
      this.ticketTypes.clearValidators();
      this.clearTicketTypes();
    }

    this.ticketTypes.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this.isPrivateSubscription?.unsubscribe();
  }

  onSubmit(): void {
    if (this.eventForm.invalid || this.isSubmitting) {
      this.eventForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.serverError = null;

    const { ticketTypes, ...formValue } = this.eventForm.value;
    const isPrivate = !!formValue.isPrivate;
    const payload = {
      ...formValue,
      reminderDaysBefore: Number(this.eventForm.value.reminderDaysBefore ?? 0),
      ticketTypes: isPrivate
        ? (ticketTypes || []).map((ticketType: any) => ({
            name: String(ticketType?.name || '').trim(),
            maxPlaces: Number(ticketType?.maxPlaces),
            paf: Number(ticketType?.paf)
          }))
        : []
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