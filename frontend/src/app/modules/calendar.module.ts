// src/app/shared/modules/calendar.module.ts
import { NgModule } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';

@NgModule({
  exports: [FullCalendarModule]
})
export class CalendarModule {}