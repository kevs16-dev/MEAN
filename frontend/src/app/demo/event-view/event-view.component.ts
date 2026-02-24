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
  viewMode: 'list' | 'calendar' = 'calendar';
  calendarOptions: any = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek,dayGridDay'
    },
    events: []
  };

  ngOnInit() {
    const storedRole = localStorage.getItem('userRole');
    const userRole =
      storedRole === 'ADMIN' || storedRole === 'BOUTIQUE'
        ? storedRole
        : 'CLIENT';

    this.eventService.getEventsForRole(userRole).subscribe(events => {
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
            description: e.description,
            location: e.location
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
}