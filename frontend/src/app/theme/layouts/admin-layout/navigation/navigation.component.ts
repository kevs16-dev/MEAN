// Angular import
import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// project import
import { SharedModule } from '../../../../theme/shared/shared.module';
import { NavContentComponent } from './nav-content/nav-content.component';
import { UserService } from '../../../../service/user.service';

@Component({
  selector: 'app-navigation',
  imports: [SharedModule, NavContentComponent, CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {
  // media 1025 After Use Menu Open
  NavCollapsedMob = output();
  SubmenuCollapse = output();
  homeRoute = '/dashboard/default';

  navCollapsedMob;
  windowWidth: number;

  // Constructor
  constructor(private userService: UserService) {
    this.windowWidth = window.innerWidth;
    this.navCollapsedMob = false;
    this.homeRoute = this.getHomeRouteByRole();
  }

  // public method
  navCollapseMob() {
    if (this.windowWidth < 1025) {
      this.NavCollapsedMob.emit();
    }
  }

  navSubmenuCollapse() {
    document.querySelector('app-navigation.pc-sidebar')?.classList.add('coded-trigger');
  }

  private getHomeRouteByRole(): string {
    const role = this.userService.getUtilisateur()?.role;
    if (role === 'ADMIN') return '/admin/home';
    if (role === 'BOUTIQUE') return '/boutique/home';
    if (role === 'CLIENT') return '/client/home';
    return '/dashboard/default';
  }
}
