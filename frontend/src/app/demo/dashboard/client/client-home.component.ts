// Angular import
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Project import
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './client-home.component.html',
  styleUrls: ['./client-home.component.scss']
})
export class ClientHomeComponent {}

