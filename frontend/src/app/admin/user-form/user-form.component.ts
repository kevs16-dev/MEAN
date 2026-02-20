
import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../service/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements AfterViewInit {
  username = '';
  nom = '';
  prenom = '';
  email = '';
  password = '';
  passwordConfirm = '';
  telephone = '';
  adresse = '';
  ville = '';
  codePostal = '';
  pays = '';
  role = '';
  message = '';
  loading = false;
  alertType: string = 'alert-success';
  roles = [
    { label: 'Administrateur', value: 'ADMIN' },
    { label: 'Client', value: 'CLIENT' },
    { label: 'Boutique', value: 'BOUTIQUE' }
  ];


  editMode = false;
  userId: string | null = null;

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.editMode = true;
        this.userId = id;
        this.loadUser(id);
      }
    });
  }

loadUser(id: string) {
    this.loading = true;
    // Réinitialiser le mot de passe à vide
    this.password = '';
    this.passwordConfirm = '';
    
    // Utiliser getUserById au lieu de getAllUsers
    this.userService.getUserById(id).subscribe({
        next: (user) => {
            if (user) {
                this.username = user.username || '';
                this.nom = user.nom || '';
                this.prenom = user.prenom || '';
                this.email = user.email || '';
                this.telephone = user.telephone || '';
                this.adresse = user.adresse || '';
                this.ville = user.ville || '';
                this.codePostal = user.codePostal || '';
                this.pays = user.pays || '';
                this.role = user.role || '';
                // NE PAS charger le mot de passe (garder vide)
            }
            this.loading = false;
            this.cdr.detectChanges();
        },
        error: (err) => {
            this.message = err.error?.message || "Erreur lors du chargement de l'utilisateur.";
            this.alertType = 'alert-error';
            this.loading = false;
            this.cdr.detectChanges();
        }
    });
}
  ngAfterViewInit(): void {}

  get passwordStrength(): number {
    const p = this.password || '';
    let score = 0;
    if (p.length >= 8) score++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    return Math.min(score, 4);
  }

  get passwordStrengthLabel(): string {
    const labels = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];
    return labels[this.passwordStrength];
  }

  get passwordRules(): { label: string; ok: boolean }[] {
    const p = this.password || '';
    return [
      { label: 'Au moins 8 caractères', ok: p.length >= 8 },
      { label: 'Une majuscule et une minuscule', ok: /[a-z]/.test(p) && /[A-Z]/.test(p) },
      { label: 'Un chiffre', ok: /\d/.test(p) },
      { label: 'Un caractère spécial', ok: /[^a-zA-Z0-9]/.test(p) }
    ];
  }

  get passwordsMatch(): boolean {
    return !!this.password && this.password === this.passwordConfirm;
  }

  get isPasswordStrong(): boolean {
    return this.passwordRules.every(r => r.ok);
  }

get canSubmit(): boolean {
  if (this.editMode) {
    // En mode édition, vérifier que les champs obligatoires sont remplis
    const baseValid = !!this.username && !!this.email && !!this.role;
    
    // Si un mot de passe est fourni, vérifier sa validité ET la correspondance
    if (this.password) {
      // Vérifier que le mot de passe est fort ET que la confirmation correspond
      return baseValid && this.passwordsMatch && this.isPasswordStrong;
    }
    
    // Pas de nouveau mot de passe = pas de validation mot de passe nécessaire
    return baseValid;
  }
  
  // Mode création : tous les champs sont requis et doivent être valides
  return !!this.username && 
         !!this.nom && 
         !!this.prenom && 
         !!this.email && 
         !!this.password && 
         this.passwordsMatch && 
         this.isPasswordStrong;
}

  submit(form: { valid?: boolean }): void {
    if (!this.canSubmit || this.loading) return;

    if (this.editMode) {
        // Edition
        this.loading = true;
        this.message = '';
        const updateData: any = {
            username: this.username,
            nom: this.nom,
            prenom: this.prenom,
            email: this.email,
            telephone: this.telephone,
            adresse: this.adresse,
            ville: this.ville,
            codePostal: this.codePostal,
            pays: this.pays,
            role: this.role
        };
        
        // Si un mot de passe est fourni, l'ajouter aux données de mise à jour
        if (this.password) {
            // Vérifier que le mot de passe est valide
            if (!this.isPasswordStrong) {
                this.message = 'Le mot de passe ne respecte pas tous les critères de sécurité';
                this.alertType = 'alert-error';
                this.loading = false;
                this.cdr.detectChanges();
                return;
            }
            
            if (!this.passwordsMatch) {
                this.message = 'Les mots de passe ne correspondent pas';
                this.alertType = 'alert-error';
                this.loading = false;
                this.cdr.detectChanges();
                return;
            }
            
            updateData.password = this.password;
        }
        
        this.userService.updateUser(this.userId!, updateData).subscribe({
            next: () => {
                this.message = 'Utilisateur modifié avec succès.';
                this.alertType = 'alert-success';
                this.loading = false;
                this.cdr.detectChanges();
                setTimeout(() => {
                    this.router.navigate(['/admin/users']);
                }, 1000);
            },
            error: err => {
                this.message = err.error?.message ?? 'Erreur lors de la modification';
                this.alertType = 'alert-error';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
        return;
    }

    // Création (comportement existant)
    if (this.password !== this.passwordConfirm) {
      this.message = 'Les mots de passe ne correspondent pas';
      this.alertType = 'alert-error';
      this.cdr.detectChanges();
      return;
    }

    if (!this.isPasswordStrong) {
      this.message = 'Le mot de passe ne respecte pas tous les critères de sécurité';
      this.alertType = 'alert-error';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.message = '';
    this.userService.createUser({
      username: this.username,
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      password: this.password,
      telephone: this.telephone,
      adresse: this.adresse,
      ville: this.ville,
      codePostal: this.codePostal,
      pays: this.pays,
      role: this.role
    }).subscribe({
      next: () => {
        this.message = 'Utilisateur créé avec succès.';
        this.alertType = 'alert-success';
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/admin/users']);
        }, 1000);
      },
      error: err => {
        this.message = err.error?.message ?? 'Erreur lors de la création';
        this.alertType = 'alert-error';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onCancel() {
    // Redirection ou reset si besoin
  }
}
