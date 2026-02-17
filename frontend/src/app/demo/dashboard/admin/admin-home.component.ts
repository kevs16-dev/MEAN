// Angular import
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Project import
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.scss']
})
export class AdminHomeComponent {}

