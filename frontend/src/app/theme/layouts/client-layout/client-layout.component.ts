// Angular import
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Project import
import { SharedModule } from '../../shared/shared.module';
import { NavBarComponent } from '../admin-layout/nav-bar/nav-bar.component';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, SharedModule, NavBarComponent, RouterModule, BreadcrumbComponent],
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.scss']
})
export class ClientLayoutComponent {}

