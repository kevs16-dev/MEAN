// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Project import
import { AdminLayout } from './theme/layouts/admin-layout/admin-layout.component';
import { GuestLayoutComponent } from './theme/layouts/guest-layout/guest-layout.component';
import { ClientLayoutComponent } from './theme/layouts/client-layout/client-layout.component';

import { AuthGuard } from './guard/auth.guard';
import { RoleGuard } from './guard/role.guard';
import { CategoryFormComponent } from './admin/category-form/category-form.component';
import { ShopFormComponent } from './admin/shop-form/shop-form.component';
import { CategoryListComponent } from './admin/category-list/category-list.component';
import { ShopListComponent } from './admin/shop-list/shop-list.component';

const routes: Routes = [
  // ZONE PROTEGÉE (AUTHENTIFIÉS) - ADMIN / BOUTIQUE
  {
    path: '',
    component: AdminLayout,
    canActivate: [AuthGuard], 
    children: [
      {
        path: '',
        redirectTo: 'dashboard/default',
        pathMatch: 'full'
      },
      {
        path: 'dashboard/default',
        loadComponent: () =>
          import('./demo/dashboard/default/default.component')
            .then((c) => c.DefaultComponent)
      },
      {
        path: 'admin/home',
        loadComponent: () =>
          import('./demo/dashboard/admin/admin-home.component')
            .then((c) => c.AdminHomeComponent)
      },
      {
        path: 'admin/users',
        loadComponent: () =>
          import('./demo/dashboard/admin/users/users-list.component')
            .then((c) => c.UsersListComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'admin/categories',
        component: CategoryListComponent
      },
      {
        path: 'admin/categories/new',
        component: CategoryFormComponent
      },
      {
        path: 'admin/shops',
        component: ShopListComponent
      },
      {
        path: 'admin/shops/new',
        component: ShopFormComponent
      },
      {
        path: 'boutique/home',
        loadComponent: () =>
          import('./demo/dashboard/boutique/boutique-home.component')
            .then((c) => c.BoutiqueHomeComponent)
      },
      {
        path: 'profil',
        loadComponent: () =>
          import('./demo/pages/profil/gestion-profil.component')
            .then((c) => c.GestionProfilComponent)
      },
      {
        path: 'typography',
        loadComponent: () =>
          import('./demo/component/basic-component/typography/typography.component')
            .then((c) => c.TypographyComponent)
      },
      {
        path: 'color',
        loadComponent: () =>
          import('./demo/component/basic-component/color/color.component')
            .then((c) => c.ColorComponent)
      },
      {
        path: 'sample-page',
        loadComponent: () =>
          import('./demo/others/sample-page/sample-page.component')
            .then((c) => c.SamplePageComponent)
      }
    ]
  },

  // ZONE PROTEGÉE CLIENT (sans aside)
  {
    path: 'client',
    component: ClientLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./demo/dashboard/client/client-home.component')
            .then((c) => c.ClientHomeComponent)
      },
      {
        path: 'shops',
        loadComponent: () =>
          import('./demo/pages/client/shops-browse/shops-browse.component')
            .then((c) => c.ShopsBrowseComponent)
      }
    ]
  },

  // ZONE PUBLIQUE (NON AUTHENTIFIÉS)
  {
    path: '',
    component: GuestLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./demo/pages/authentication/auth-login/auth-login.component')
            .then((c) => c.AuthLoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./demo/pages/authentication/auth-register/auth-register.component')
            .then((c) => c.AuthRegisterComponent)
      }
    ]
  },

  // ROUTE INCONNUE → LOGIN
  {
    path: '**',
    redirectTo: 'login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}