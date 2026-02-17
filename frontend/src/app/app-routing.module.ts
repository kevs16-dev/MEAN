// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Project import
import { AdminLayout } from './theme/layouts/admin-layout/admin-layout.component';
import { GuestLayoutComponent } from './theme/layouts/guest-layout/guest-layout.component';
import { ClientLayoutComponent } from './theme/layouts/client-layout/client-layout.component';

import { AuthGuard } from './guard/auth.guard';

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