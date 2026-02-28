import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'src/app/modules/calendar.module';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { EventService } from 'src/app/service/event.service';

@Component({
  selector: 'app-client-events',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarModule],
  templateUrl: './client-events.component.html',
  styleUrls: ['./client-events.component.scss']
})
export class ClientEventsComponent implements OnInit, OnDestroy {
  private eventService = inject(EventService);

  searchTerm = '';
  dateFilter: 'ALL' | 'UPCOMING' | 'PAST' = 'ALL';
  events: any[] = [];
  viewMode: 'list' | 'calendar' = 'calendar';
  selectedEvent: any | null = null;
  isEventModalOpen = false;
  registrationSuccess: string | null = null;
  registrationError: string | null = null;
  registeringTicketTypeName: string | null = null;
  isDownloadingTicket = false;
  carouselStartIndex = 0;
  cardsPerView = 5;
  private autoScrollTimer: ReturnType<typeof setInterval> | null = null;

  calendarOptions: any = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek'
    },
    events: [],
    eventClick: (arg: any) => this.handleCalendarEventClick(arg)
  };

  ngOnInit(): void {
    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.stopAutoScroll();
  }

  toggleView(): void {
    this.viewMode = this.viewMode === 'calendar' ? 'list' : 'calendar';
    if (this.viewMode === 'list') {
      this.resetCarousel();
      return;
    }
    this.stopAutoScroll();
  }

  get filteredEvents(): any[] {
    const now = new Date();
    const filtered = this.events.filter((e) => {
      const search = this.searchTerm.toLowerCase();
      const matchesSearch = !search ||
        e.title?.toLowerCase().includes(search) ||
        e.description?.toLowerCase().includes(search);

      const startDate = new Date(e.startDate);
      const matchesDate =
        this.dateFilter === 'ALL' ||
        (this.dateFilter === 'UPCOMING' && startDate >= now) ||
        (this.dateFilter === 'PAST' && startDate < now);

      return matchesSearch && matchesDate;
    });

    return this.sortEventsUpcomingToPast(filtered);
  }

  get visibleEvents(): any[] {
    const events = this.filteredEvents;
    if (events.length <= this.cardsPerView) {
      return events;
    }

    const visible: any[] = [];
    for (let i = 0; i < this.cardsPerView; i += 1) {
      const idx = (this.carouselStartIndex + i) % events.length;
      visible.push(events[idx]);
    }
    return visible;
  }

  openEventModal(event: any): void {
    this.registrationSuccess = null;
    this.registrationError = null;
    this.selectedEvent = event;
    this.isEventModalOpen = true;
  }

  closeEventModal(): void {
    this.isEventModalOpen = false;
    this.selectedEvent = null;
    this.registrationSuccess = null;
    this.registrationError = null;
    this.registeringTicketTypeName = null;
    this.isDownloadingTicket = false;
  }

  getRemainingPlaces(event: any, ticketType: any): number {
    const maxPlaces = Number(ticketType?.maxPlaces ?? 0);
    if (maxPlaces <= 0) {
      return 0;
    }

    const ticketTypeName = String(ticketType?.name || '').trim().toLowerCase();
    const registrations = Array.isArray(event?.registrations) ? event.registrations : [];
    const used = registrations.filter((registration: any) =>
      String(registration?.ticketTypeName || '').trim().toLowerCase() === ticketTypeName
    ).length;

    return Math.max(0, maxPlaces - used);
  }

  isPrivateEvent(event: any): boolean {
    return !!event?.isPrivate;
  }

  isRegisteredToEvent(event: any): boolean {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      return false;
    }

    const registrations = Array.isArray(event?.registrations) ? event.registrations : [];
    return registrations.some((registration: any) => {
      const registrationUser = registration?.user;
      const registrationUserId = typeof registrationUser === 'object'
        ? registrationUser?._id
        : registrationUser;
      return String(registrationUserId || '') === String(currentUserId);
    });
  }

  registerToPrivateEvent(ticketTypeName: string): void {
    if (!this.selectedEvent?._id || !ticketTypeName || this.registeringTicketTypeName) {
      return;
    }

    this.registrationSuccess = null;
    this.registrationError = null;
    this.registeringTicketTypeName = ticketTypeName;

    this.eventService.registerToPrivateEvent(this.selectedEvent._id, ticketTypeName).subscribe({
      next: (updatedEvent) => {
        this.registeringTicketTypeName = null;
        this.registrationSuccess = 'Inscription confirmée.';
        this.selectedEvent = updatedEvent;
        this.events = this.events.map((event) => event._id === updatedEvent._id ? updatedEvent : event);
        this.refreshCalendarEvents(this.events);
      },
      error: (err) => {
        this.registeringTicketTypeName = null;
        this.registrationError =
          err?.error?.message || "Erreur lors de l'inscription à l'évènement.";
      }
    });
  }

  downloadMyTicket(): void {
    if (!this.selectedEvent?._id || this.isDownloadingTicket) {
      return;
    }

    this.registrationError = null;
    this.registrationSuccess = null;
    this.isDownloadingTicket = true;

    this.eventService.downloadPrivateEventTicket(this.selectedEvent._id).subscribe({
      next: (blob) => {
        this.isDownloadingTicket = false;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ticket-evenement-${this.selectedEvent._id}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.isDownloadingTicket = false;
        this.registrationError =
          err?.error?.message || 'Erreur lors du téléchargement du ticket.';
      }
    });
  }

  private handleCalendarEventClick(arg: any): void {
    const clickedEvent = arg?.event;
    if (!clickedEvent) {
      return;
    }

    this.selectedEvent = {
      _id: clickedEvent.id,
      title: clickedEvent.title,
      description: clickedEvent.extendedProps?.description,
      location: clickedEvent.extendedProps?.location,
      reminderDaysBefore: clickedEvent.extendedProps?.reminderDaysBefore ?? 0,
      isPrivate: !!clickedEvent.extendedProps?.isPrivate,
      ticketTypes: clickedEvent.extendedProps?.ticketTypes || [],
      registrations: clickedEvent.extendedProps?.registrations || [],
      startDate: clickedEvent.start,
      endDate: clickedEvent.end
    };
    this.registrationSuccess = null;
    this.registrationError = null;
    this.isEventModalOpen = true;
  }

  resetCarousel(): void {
    this.carouselStartIndex = 0;
    this.setupAutoScroll();
  }

  private setupAutoScroll(): void {
    this.stopAutoScroll();
    if (this.viewMode !== 'list' || this.filteredEvents.length <= this.cardsPerView) {
      return;
    }
    this.autoScrollTimer = setInterval(() => {
      const total = this.filteredEvents.length;
      if (total <= this.cardsPerView) {
        this.stopAutoScroll();
        return;
      }
      this.carouselStartIndex = (this.carouselStartIndex + 1) % total;
    }, 3000);
  }

  private stopAutoScroll(): void {
    if (this.autoScrollTimer) {
      clearInterval(this.autoScrollTimer);
      this.autoScrollTimer = null;
    }
  }

  private loadEvents(): void {
    this.eventService.getEventsForRole('CLIENT', 'PUBLISHED').subscribe((events) => {
      this.events = events;
      this.refreshCalendarEvents(events);
      this.resetCarousel();
    });
  }

  private refreshCalendarEvents(events: any[]): void {
    this.calendarOptions = {
      ...this.calendarOptions,
      events: events.map((e) => ({
        id: e._id,
        title: e.title,
        start: e.startDate,
        end: e.endDate,
        classNames: [e.isPrivate ? 'event-private' : 'event-public'],
        extendedProps: {
          description: e.description,
          location: e.location,
          reminderDaysBefore: e.reminderDaysBefore ?? 0,
          isPrivate: !!e.isPrivate,
          ticketTypes: e.ticketTypes || [],
          registrations: e.registrations || []
        }
      }))
    };
  }

  private sortEventsUpcomingToPast(events: any[]): any[] {
    const nowMs = Date.now();

    const upcoming = events
      .filter((event) => new Date(event.startDate).getTime() >= nowMs)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const past = events
      .filter((event) => new Date(event.startDate).getTime() < nowMs)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return [...upcoming, ...past];
  }

  private getCurrentUserId(): string | null {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      return null;
    }

    try {
      const user = JSON.parse(rawUser);
      return user?._id || user?.id || null;
    } catch {
      return null;
    }
  }
}
