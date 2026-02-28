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
    this.eventService.getEventsForRole('CLIENT', 'PUBLISHED').subscribe((events) => {
      this.events = events;
      this.calendarOptions = {
        ...this.calendarOptions,
        events: events.map((e) => ({
          id: e._id,
          title: e.title,
          start: e.startDate,
          end: e.endDate,
          extendedProps: {
            description: e.description,
            location: e.location,
            reminderDaysBefore: e.reminderDaysBefore ?? 0
          }
        }))
      };
      this.resetCarousel();
    });
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
    return this.events.filter((e) => {
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
    this.selectedEvent = event;
    this.isEventModalOpen = true;
  }

  closeEventModal(): void {
    this.isEventModalOpen = false;
    this.selectedEvent = null;
  }

  private handleCalendarEventClick(arg: any): void {
    const clickedEvent = arg?.event;
    if (!clickedEvent) {
      return;
    }

    this.selectedEvent = {
      title: clickedEvent.title,
      description: clickedEvent.extendedProps?.description,
      location: clickedEvent.extendedProps?.location,
      reminderDaysBefore: clickedEvent.extendedProps?.reminderDaysBefore ?? 0,
      startDate: clickedEvent.start,
      endDate: clickedEvent.end
    };
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
}
