// angular import
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  input,
  output
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

// project import
import { SharedModule } from '../../../../../theme/shared/shared.module';
import { AuthService } from '../../../../../service/auth.service';

// icon
import { IconService } from '@ant-design/icons-angular';
import {
  BellOutline,
  SettingOutline,
  GiftOutline,
  MessageOutline,
  PhoneOutline,
  CheckCircleOutline,
  LogoutOutline,
  EditOutline,
  UserOutline,
  ProfileOutline,
  WalletOutline,
  QuestionCircleOutline,
  LockOutline,
  CommentOutline,
  UnorderedListOutline,
  ArrowRightOutline,
  GithubOutline
} from '@ant-design/icons-angular/icons';
import { UserService } from '../../../../../service/user.service';
import { NotificationService } from '../../../../../service/notification.service';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-nav-right',
  imports: [SharedModule, RouterModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavRightComponent implements OnInit, AfterViewInit, OnDestroy {
  private iconService = inject(IconService);
  utilisateur : any;
  notifications: any[] = [];
  unreadCount = 0;
  loadingNotifications: boolean = false;
  showAllNotifications = false;
  showHistoryModal = false;
  historyLoading = false;
  historyError: string | null = null;
  myActivities: any[] = [];
  historyPage = 1;
  historyLimit = 10;
  historyTotal = 0;

  private notificationsSub?: Subscription;

  // public props
  styleSelectorToggle = input<boolean>();
  readonly Customize = output();
  windowWidth: number;
  screenFull: boolean = true;
  direction: string = 'ltr';

  // constructor
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.windowWidth = window.innerWidth;
    this.iconService.addIcon(
      ...[
        CheckCircleOutline,
        GiftOutline,
        MessageOutline,
        SettingOutline,
        PhoneOutline,
        LogoutOutline,
        EditOutline,
        UserOutline,
        EditOutline,
        ProfileOutline,
        QuestionCircleOutline,
        LockOutline,
        CommentOutline,
        UnorderedListOutline,
        ArrowRightOutline,
        BellOutline,
        GithubOutline,
        WalletOutline
      ]
    );
  }

  ngOnInit() {
    this.utilisateur = this.userService.getUtilisateur();
  }

  ngAfterViewInit() {
    if (this.utilisateur?._id) {
      // lancer le polling après le premier cycle de détection
      setTimeout(() => this.startNotificationsPolling());
    }
  }

  private startNotificationsPolling() {
    this.notificationsSub = timer(300, 10000)
      .pipe(switchMap(() => this.notificationService.getUserNotifications()))
      .subscribe({
        next: (data) => {
          // repousser la mise à jour au prochain cycle pour éviter NG0100
          setTimeout(() => {
            this.notifications = [...data].sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            this.unreadCount = this.notifications.filter(notification => !notification.isRead).length;
            this.loadingNotifications = false;
            this.cdr.markForCheck();
          });
        },
        error: () => {
          this.loadingNotifications = false;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy() {
    this.notificationsSub?.unsubscribe();
  }

  markAsRead(notification: any) {
    if (notification.isRead) return;

    this.notificationService.markAsRead(notification._id).subscribe(() => {
      notification.isRead = true;
      this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    });
  }

  markAllAsRead() {
    const unread = this.notifications.filter(n => !n.isRead);

    unread.forEach(notification => {
      this.notificationService.markAsRead(notification._id).subscribe(() => {
        notification.isRead = true;
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;
      });
    });
  }

  toggleShowAll() {
    this.showAllNotifications = !this.showAllNotifications;
  }

  openHistory() {
    this.showHistoryModal = true;
    this.historyPage = 1;
    this.loadMyHistory();
  }

  closeHistory() {
    this.showHistoryModal = false;
    this.myActivities = [];
    this.historyError = null;
    this.historyLoading = false;
    this.historyPage = 1;
    this.historyTotal = 0;
    this.cdr.markForCheck();
  }

  loadMyHistory() {
    this.historyLoading = true;
    this.historyError = null;
    this.userService.getMyActivity({ page: this.historyPage, limit: this.historyLimit }).subscribe({
      next: (res) => {
        this.myActivities = Array.isArray(res.logs) ? res.logs : [];
        this.historyTotal = typeof res.total === 'number' ? res.total : 0;
        this.historyLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.historyError = err?.error?.message || "Erreur lors de la récupération de l'historique";
        this.myActivities = [];
        this.historyTotal = 0;
        this.historyLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  goToHistoryPage(page: number) {
    if (page < 1 || page > this.historyTotalPages) return;
    this.historyPage = page;
    this.loadMyHistory();
  }

  get historyTotalPages(): number {
    const pages = Math.ceil((this.historyTotal || 0) / (this.historyLimit || 1));
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

  deconnexion() {
    event.preventDefault();
    this.authService.deconnexion();
  }

  profile = [
    {
      icon: 'edit',
      title: 'Modifier Profil',
      action: () => this.router.navigate(['/profil'])
    },
    {
      icon: 'user',
      title: 'View Profile'
    },
    {
      icon: 'profile',
      title: 'Social Profile'
    },
    {
      icon: 'wallet',
      title: 'Billing'
    },
    {
      icon: 'logout',
      title: 'Déconnexion',
      action: () => this.deconnexion()
    }
  ];

  setting = [
    {
      icon: 'question-circle',
      title: 'Support'
    },
    {
      icon: 'user',
      title: 'Account Settings'
    },
    {
      icon: 'lock',
      title: 'Privacy Center'
    },
    {
      icon: 'comment',
      title: 'Feedback'
    },
    {
      icon: 'unordered-list',
      title: 'Historique',
      action: () => this.openHistory()
    }
  ];
}
