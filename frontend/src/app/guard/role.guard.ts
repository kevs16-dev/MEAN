import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { UserService } from '../service/user.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const allowedRoles = route.data['roles'] as string[] | undefined;
    const user = this.userService.getUtilisateur();

    if (!user) {
      return this.router.parseUrl('/login');
    }

    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    if (allowedRoles.includes(user.role)) {
      return true;
    }

    return this.router.parseUrl('/dashboard/default');
  }
}
