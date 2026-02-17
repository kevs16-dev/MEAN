// angular import
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// project import
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { UserService } from 'src/app/service/user.service';

@Component({
  selector: 'app-gestion-profil',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './gestion-profil.component.html',
  styleUrls: ['./gestion-profil.component.scss']
})
export class GestionProfilComponent {
  // public props
  utilisateur: any = {};
  loading = false;
  message = '';
  alertType: string = 'alert-success';

  // Password change data
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  showPasswordSection = false;

  constructor(private cdr: ChangeDetectorRef, private userService: UserService) {}

  get canSubmitProfile(): boolean {
    return !!this.utilisateur.nom && !!this.utilisateur.prenom && !!this.utilisateur.email;
  }

  get canSubmitPassword(): boolean {
    return !!this.passwordData.currentPassword && 
           !!this.passwordData.newPassword && 
           !!this.passwordData.confirmPassword &&
           this.passwordData.newPassword === this.passwordData.confirmPassword;
  }

  submitProfile(): void {
    if (!this.canSubmitProfile || this.loading) return;

    this.loading = true;
    this.message = '';

    const updateData = {
      nom: this.utilisateur.nom,
      prenom: this.utilisateur.prenom,
      email: this.utilisateur.email,
      telephone: this.utilisateur.telephone,
      adresse: this.utilisateur.adresse,
      ville: this.utilisateur.ville,
      codePostal: this.utilisateur.codePostal,
      pays: this.utilisateur.pays,
      avatar: this.utilisateur.avatar
    };

    this.userService.updateProfile({id: this.utilisateur._id, ...updateData}).subscribe({
      next: (res) => {
        this.message = 'Profil mis à jour avec succès';
        this.alertType = 'alert-success';
        this.loading = false;

        this.utilisateur = res.user;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.message =
          err.error.message || 'Erreur lors de la mise à jour du profil';
        this.alertType = 'alert-error';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submitPassword(): void {
    if (!this.canSubmitPassword || this.loading) return;

    this.loading = true;
    this.message = '';

    this.userService.updatePassword({
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword
    }).subscribe({
      next: () => {
        this.message = 'Mot de passe modifié avec succès';
        this.alertType = 'alert-success';
        this.loading = false;

        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        this.showPasswordSection = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        const code = err?.error?.code;
        this.message =
          code === 'INVALID_CURRENT_PASSWORD'
            ? 'Mot de passe actuel incorrect'
            : err.message || 'Erreur lors de la mise à jour du mot de passe1';

        this.alertType = 'alert-error';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  togglePasswordSection(): void {
    this.showPasswordSection = !this.showPasswordSection;
    if (!this.showPasswordSection) {
      this.passwordData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      // TODO: Handle file upload
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.utilisateur.avatar = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  ngOnInit() {
    this.utilisateur = this.userService.getUtilisateur();
  }
}
