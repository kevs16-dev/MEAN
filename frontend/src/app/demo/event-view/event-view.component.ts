import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../../service/event.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CalendarModule } from 'src/app/modules/calendar.module';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

@Component({
  selector: 'app-event-view',
  standalone: true,
  imports: [CommonModule, CalendarModule, FormsModule],
  templateUrl: './event-view.component.html',
  styleUrls: ['./event-view.component.scss']
})
export class EventViewComponent implements OnInit {
  private eventService = inject(EventService);
  readonly router = inject(Router);

  currentPage = 1;
  pageSize = 5;
  searchTerm = '';
  dateFilter: 'ALL' | 'UPCOMING' | 'PAST' = 'ALL';
  events: any[] = [];
  userRole: 'ADMIN' | 'BOUTIQUE' | 'CLIENT' = 'CLIENT';
  currentUserId: string | null = null;
  viewMode: 'list' | 'calendar' = 'calendar';
  selectedEvent: any | null = null;
  isEventModalOpen = false;
  isParticipantsModalOpen = false;
  participantsLoading = false;
  participantsError: string | null = null;
  participants: any[] = [];
  participantsEventTitle = '';
  calendarOptions: any = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek,dayGridDay'
    },
    events: [],
    eventClick: (arg: any) => this.handleCalendarEventClick(arg)
  };

  ngOnInit() {
    this.userRole = this.getStoredUserRole();
    this.currentUserId = this.getStoredUserId();

    this.eventService.getEventsForRole(this.userRole).subscribe(events => {
      this.events = events;

      // ⬇️ on met à jour SEULEMENT la propriété events
      this.calendarOptions = {
        ...this.calendarOptions,
        events: events.map(e => ({
          id: e._id,
          title: e.title,
          start: e.startDate,
          end: e.endDate,
          extendedProps: {
            _id: e._id,
            description: e.description,
            location: e.location,
            reminderDaysBefore: e.reminderDaysBefore ?? 0,
            isPrivate: !!e.isPrivate
          }
        }))
      };
    });
  }

  toggleView() {
    this.viewMode = this.viewMode === 'calendar' ? 'list' : 'calendar';
  }

  get filteredEvents() {
    const now = new Date();

    return this.events.filter(e => {
      const matchesSearch =
        e.title?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        e.description?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const startDate = new Date(e.startDate);

      const matchesDate =
        this.dateFilter === 'ALL' ||
        (this.dateFilter === 'UPCOMING' && startDate >= now) ||
        (this.dateFilter === 'PAST' && startDate < now);

      return matchesSearch && matchesDate;
    });
  }

  get paginatedEvents() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEvents.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredEvents.length / this.pageSize);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  closeEventModal() {
    this.isEventModalOpen = false;
    this.selectedEvent = null;
  }

  closeParticipantsModal(): void {
    this.isParticipantsModalOpen = false;
    this.participants = [];
    this.participantsError = null;
    this.participantsLoading = false;
    this.participantsEventTitle = '';
  }

  canShowParticipants(event: any): boolean {
    return this.userRole === 'BOUTIQUE' && !!event?.isPrivate && this.isEventOwnedByCurrentUser(event);
  }

  openParticipants(event: any): void {
    if (!event?._id || !this.canShowParticipants(event)) {
      return;
    }

    this.isParticipantsModalOpen = true;
    this.participantsLoading = true;
    this.participantsError = null;
    this.participants = [];
    this.participantsEventTitle = event.title || 'Evènement privé';

    this.eventService.getPrivateEventParticipants(event._id).subscribe({
      next: (data) => {
        this.participantsLoading = false;
        this.participants = data?.participants || [];
        this.participantsEventTitle = data?.eventTitle || this.participantsEventTitle;
      },
      error: (err) => {
        this.participantsLoading = false;
        this.participantsError = err?.error?.message || 'Impossible de récupérer les participants.';
      }
    });
  }

  private handleCalendarEventClick(arg: any): void {
    const clickedEvent = arg?.event;
    if (!clickedEvent) {
      return;
    }

    this.selectedEvent = {
      _id: clickedEvent.extendedProps?._id || clickedEvent.id,
      title: clickedEvent.title,
      description: clickedEvent.extendedProps?.description,
      location: clickedEvent.extendedProps?.location,
      reminderDaysBefore: clickedEvent.extendedProps?.reminderDaysBefore ?? 0,
      isPrivate: !!clickedEvent.extendedProps?.isPrivate,
      startDate: clickedEvent.start,
      endDate: clickedEvent.end
    };
    this.isEventModalOpen = true;
  }

  private getStoredUserRole(): 'ADMIN' | 'BOUTIQUE' | 'CLIENT' {
    const roleFromKey = localStorage.getItem('userRole');
    if (roleFromKey === 'ADMIN' || roleFromKey === 'BOUTIQUE' || roleFromKey === 'CLIENT') {
      return roleFromKey;
    }

    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      return 'CLIENT';
    }

    try {
      const parsedUser = JSON.parse(rawUser);
      const role = parsedUser?.role;
      return role === 'ADMIN' || role === 'BOUTIQUE' || role === 'CLIENT' ? role : 'CLIENT';
    } catch {
      return 'CLIENT';
    }
  }

  private getStoredUserId(): string | null {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      return null;
    }

    try {
      const parsedUser = JSON.parse(rawUser);
      return parsedUser?._id || parsedUser?.id || null;
    } catch {
      return null;
    }
  }

  private isEventOwnedByCurrentUser(event: any): boolean {
    if (!this.currentUserId) {
      return false;
    }
    const createdBy = event?.createdBy;
    const createdById = typeof createdBy === 'object' ? createdBy?._id : createdBy;
    return String(createdById || '') === String(this.currentUserId);
  }
}