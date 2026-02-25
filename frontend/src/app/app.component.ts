// angular import
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// project import
import { SpinnerComponent } from './theme/shared/components/spinner/spinner.component';
import { GaTrackerService } from './service/ga-tracker.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet, SpinnerComponent]
})
export class AppComponent {
  // public props
  title = 'mantis-free-version';

  constructor(private gaTrackerService: GaTrackerService) {
    this.gaTrackerService.startTracking();
  }
}
