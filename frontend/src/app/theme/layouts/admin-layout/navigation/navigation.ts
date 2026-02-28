export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  bootstrapIcon?: string;
  hidden?: boolean;
  roles?: string[];
  url?: string;
  classes?: string;
  groupClasses?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  link?: string;
  description?: string;
  path?: string
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'dashboard-admin',
        title: 'Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/home',
        icon: 'dashboard',
        roles: ['ADMIN'],
        breadcrumbs: false
      },
      {
        id: 'dashboard-boutique',
        title: 'Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/boutique/home',
        icon: 'dashboard',
        roles: ['BOUTIQUE'],
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'administration',
    title: 'Administration',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'notifications-new',
        title: 'Notifications',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/notifications',
        icon: 'bell',
        roles: ['ADMIN', 'BOUTIQUE'],
        breadcrumbs: false
      },
      {
        id: 'event-new',
        title: 'Evénements',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/events',
        icon: 'calendar',
        roles: ['ADMIN', 'BOUTIQUE'],
        breadcrumbs: false
      },
      {
        id: 'admin-categories-new',
        title: 'Catégories',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/categories',
        icon: 'profile',
        roles: ['ADMIN'],
        breadcrumbs: false
      },
      {
        id: 'admin-shops-new',
        title: 'Boutiques',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/shops',
        bootstrapIcon: 'bi bi-shop',
        roles: ['ADMIN'],
        breadcrumbs: false
      },
      {
        id: 'admin-banners',
        title: 'Bannières',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/banners',
        icon: 'profile',
        roles: ['ADMIN'],
        breadcrumbs: false
      },
      {
        id: 'boutique-products',
        title: 'Mes produits',
        type: 'item',
        classes: 'nav-item',
        url: '/boutique/products',
        icon: 'profile',
        roles: ['BOUTIQUE'],
        breadcrumbs: false
      },
      {
        id: 'boutique-orders',
        title: 'Mes commandes',
        type: 'item',
        classes: 'nav-item',
        url: '/boutique/orders',
        icon: 'unordered-list',
        roles: ['BOUTIQUE'],
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'user',
    title: 'User',
    type: 'group',
    icon: 'icon-navigation',
    roles: ['ADMIN'],
    children: [
      {
        id: 'users-list',
        title: 'Utilisateurs',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/users',
        icon: 'user',
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'authentication',
    title: 'Authentication',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'login',
        title: 'Login',
        type: 'item',
        classes: 'nav-item',
        url: '/login',
        icon: 'login',
        target: true,
        breadcrumbs: false
      },
      {
        id: 'register',
        title: 'Register',
        type: 'item',
        classes: 'nav-item',
        url: '/register',
        icon: 'profile',
        target: true,
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'utilities',
    title: 'UI Components',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'typography',
        title: 'Typography',
        type: 'item',
        classes: 'nav-item',
        url: '/typography',
        icon: 'font-size'
      },
      {
        id: 'color',
        title: 'Colors',
        type: 'item',
        classes: 'nav-item',
        url: '/color',
        icon: 'bg-colors'
      },
      {
        id: 'ant-icons',
        title: 'Ant Icons',
        type: 'item',
        classes: 'nav-item',
        url: 'https://ant.design/components/icon',
        icon: 'ant-design',
        target: true,
        external: true
      }
    ]
  },

  {
    id: 'other',
    title: 'Other',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'sample-page',
        title: 'Sample Page',
        type: 'item',
        url: '/sample-page',
        classes: 'nav-item',
        icon: 'chrome'
      },
      {
        id: 'document',
        title: 'Document',
        type: 'item',
        classes: 'nav-item',
        url: 'https://codedthemes.gitbook.io/mantis-angular/',
        icon: 'question',
        target: true,
        external: true
      }
    ]
  }
];
