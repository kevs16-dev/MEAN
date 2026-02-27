import { Router } from '@angular/router';
import { Component, ChangeDetectorRef } from '@angular/core';
import { Subject, debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from '../../../../service/user.service';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, CardComponent, FormsModule],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent {
  users: any[] = [];
  loading = false;
  error: string | null = null;
  statusUpdateUserId: string | null = null;

  showDeleteModal = false;
  userToDelete: any = null;
  deleteLoading = false;

  showActivityModal = false;
  activityLoading = false;
  activityError: string | null = null;
  selectedUserForActivity: any = null;
  userActivities: any[] = [];
  activityPage = 1;
  activityLimit = 10;
  activityTotal = 0;
  activityExportFormat: 'json' | 'pdf' = 'json';
  exportLoading = false;
  showGlobalExportModal = false;
  globalExportFormat: 'json' | 'pdf' = 'json';
  globalExportLoading = false;
  globalExportError: string | null = null;
  
  // Pagination et filtre
  page = 1;
  limit = 10;
  limits = [5, 10, 20];
  total = 0;
  role = 'ALL';
  roles = [
    { label: 'Tous', value: 'ALL' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Boutique', value: 'BOUTIQUE' },
    { label: 'Client', value: 'CLIENT' }
  ];

  private filterChanged$ = new Subject<void>();

  constructor(private userService: UserService, private cdr: ChangeDetectorRef, private router: Router) {
    this.filterChanged$.pipe(debounceTime(300)).subscribe(() => {
      this.loadUsers();
    });
    this.loadUsers();
  }

  onCreateUser() {
    this.router.navigate(['/admin/users/new']);
  }

  openGlobalExportModal() {
    this.globalExportError = null;
    this.showGlobalExportModal = true;
    this.cdr.detectChanges();
  }

  closeGlobalExportModal() {
    this.showGlobalExportModal = false;
    this.globalExportError = null;
    this.globalExportLoading = false;
    this.cdr.detectChanges();
  }

  onEditUser(user: any) {
    this.router.navigate(['/admin/users/edit', user._id || user.id]);
  }

  onToggleUserStatus(user: any) {
    const userId = user?._id || user?.id;
    if (!userId || this.statusUpdateUserId) return;

    this.statusUpdateUserId = userId;
    const nextStatus = user.isActive === false;

    this.userService.updateUser(userId, { isActive: nextStatus }).subscribe({
      next: (res) => {
        user.isActive = res?.user?.isActive ?? nextStatus;
        this.statusUpdateUserId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Erreur lors de la mise à jour du statut utilisateur';
        this.statusUpdateUserId = null;
        this.cdr.detectChanges();
      }
    });
  }

  // NOUVELLE MÉTHODE - Ouvrir le modal de confirmation
  onDeleteUser(user: any) {
    this.userToDelete = user;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  // NOUVELLE MÉTHODE - Fermer le modal sans supprimer
  cancelDelete() {
    this.showDeleteModal = false;
    this.userToDelete = null;
    this.deleteLoading = false;
    this.cdr.detectChanges();
  }

  // NOUVELLE MÉTHODE - Confirmer la suppression
  confirmDelete() {
    if (!this.userToDelete) return;
    
    this.deleteLoading = true;
    const userId = this.userToDelete._id || this.userToDelete.id;
    
    this.userService.deleteUser(userId).subscribe({
      next: () => {
        // Recharger la liste
        this.loadUsers();
        // Fermer le modal
        this.showDeleteModal = false;
        this.userToDelete = null;
        this.deleteLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la suppression';
        this.deleteLoading = false;
        // Optionnel : garder le modal ouvert pour montrer l'erreur
        this.cdr.detectChanges();
        
        // Fermer le modal après 3 secondes en cas d'erreur
        setTimeout(() => {
          this.showDeleteModal = false;
          this.userToDelete = null;
          this.cdr.detectChanges();
        }, 3000);
      }
    });
  }


  loadUsers() {
    this.loading = true;
    this.userService.getAllUsers({ page: this.page, limit: this.limit, role: this.role }).subscribe({
      next: (res) => {
        this.users = Array.isArray(res.users) ? res.users : [];
        this.total = typeof res.total === 'number' ? res.total : 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Erreur lors de la récupération des utilisateurs';
        this.users = [];
        this.total = 0;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onRoleChange(event: Event) {
    const newRole = (event.target as HTMLSelectElement).value;
    this.role = newRole;
    this.page = 1;
    this.filterChanged$.next();
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadUsers();
  }

  onLimitChange(newLimit: number) {
    if (this.limits.includes(newLimit)) {
      this.limit = newLimit;
      this.page = 1;
      this.filterChanged$.next();
      this.cdr.detectChanges();
    }
  }

  get totalPages(): number {
    const limit = this.limit || 1;
    const total = this.total || 0;
    const pages = Math.ceil(total / limit);
    return pages > 0 ? pages : 1;
  }

  onOpenActivity(user: any) {
    this.selectedUserForActivity = user;
    this.showActivityModal = true;
    this.activityPage = 1;
    this.activityError = null;
    this.loadUserActivities();
    this.cdr.detectChanges();
  }

  closeActivityModal() {
    this.showActivityModal = false;
    this.selectedUserForActivity = null;
    this.userActivities = [];
    this.activityPage = 1;
    this.activityTotal = 0;
    this.activityLoading = false;
    this.activityError = null;
    this.cdr.detectChanges();
  }

  loadUserActivities() {
    const userId = this.selectedUserForActivity?._id || this.selectedUserForActivity?.id;
    if (!userId) return;

    this.activityLoading = true;
    this.activityError = null;

    this.userService
      .getUserActivity(userId, { page: this.activityPage, limit: this.activityLimit })
      .subscribe({
        next: (res) => {
          this.userActivities = Array.isArray(res.logs) ? res.logs : [];
          this.activityTotal = typeof res.total === 'number' ? res.total : 0;
          this.activityLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.activityError = err?.error?.message || "Erreur lors de la récupération de l'historique";
          this.userActivities = [];
          this.activityTotal = 0;
          this.activityLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  goToActivityPage(p: number) {
    if (p < 1 || p > this.activityTotalPages) return;
    this.activityPage = p;
    this.loadUserActivities();
  }

  exportActivity(deleteAfterExport: boolean) {
    const userId = this.selectedUserForActivity?._id || this.selectedUserForActivity?.id;
    if (!userId || this.exportLoading) return;

    this.exportLoading = true;
    this.activityError = null;

    this.userService.exportUserActivity(userId, this.activityExportFormat, deleteAfterExport).subscribe({
      next: (blob) => {
        const timestamp = Date.now();
        const extension = this.activityExportFormat === 'pdf' ? 'pdf' : 'json';
        const username = this.selectedUserForActivity?.username || userId;
        const fileName = `activity-${username}-${timestamp}.${extension}`;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);

        if (deleteAfterExport) {
          this.activityPage = 1;
          this.loadUserActivities();
        }

        this.exportLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.activityError = err?.error?.message || "Erreur lors de l'export de l'historique";
        this.exportLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  exportAllActivities(deleteAfterExport: boolean) {
    if (this.globalExportLoading) return;

    this.globalExportLoading = true;
    this.globalExportError = null;

    this.userService.exportAllUsersActivity(this.globalExportFormat, deleteAfterExport).subscribe({
      next: (blob) => {
        const timestamp = Date.now();
        const extension = this.globalExportFormat === 'pdf' ? 'pdf' : 'json';
        const fileName = `activity-all-users-${timestamp}.${extension}`;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);

        if (deleteAfterExport && this.showActivityModal) {
          this.activityPage = 1;
          this.loadUserActivities();
        }

        this.globalExportLoading = false;
        this.closeGlobalExportModal();
      },
      error: (err) => {
        this.globalExportError = err?.error?.message || "Erreur lors de l'export global";
        this.globalExportLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get activityTotalPages(): number {
    const limit = this.activityLimit || 1;
    const total = this.activityTotal || 0;
    const pages = Math.ceil(total / limit);
    return pages > 0 ? pages : 1;
  }

  getActionLabel(actionType: string): string {
    switch (actionType) {
      case 'PRODUCT_CREATED':
        return 'Création produit';
      case 'PRODUCT_UPDATED':
        return 'Mise à jour produit';
      case 'EVENT_CREATED':
        return 'Création évènement';
      case 'LOGIN_SUCCESS':
        return 'Connexion';
      default:
        return actionType || 'Action';
    }
  }
}
