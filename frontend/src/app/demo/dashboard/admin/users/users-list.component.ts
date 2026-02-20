import { Router } from '@angular/router';
import { Component, ChangeDetectorRef } from '@angular/core';
import { Subject, debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from 'src/app/service/user.service';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

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

  showDeleteModal = false;
  userToDelete: any = null;
  deleteLoading = false;
  
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

  onEditUser(user: any) {
    this.router.navigate(['/admin/users/edit', user._id || user.id]);
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
}
