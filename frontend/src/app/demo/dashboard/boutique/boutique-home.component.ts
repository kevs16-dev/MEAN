// Angular import
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Project import
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

@Component({
  selector: 'app-boutique-home',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './boutique-home.component.html',
  styleUrls: ['./boutique-home.component.scss']
})
export class BoutiqueHomeComponent {}

