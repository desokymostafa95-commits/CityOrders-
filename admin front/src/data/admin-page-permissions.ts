export interface AdminPagePermission {
    key: string;
    path: string;
    labelKey: string;
    group: string;
    description: string;
}

export const ADMIN_PAGE_PERMISSIONS: AdminPagePermission[] = [
    {
        key: 'page:dashboard',
        path: '/dashboard',
        labelKey: 'sidebar.dashboard',
        group: 'Overview',
        description: 'View dashboard, platform stats, analytics, and health widgets.',
    },
    {
        key: 'page:merchant-approvals',
        path: '/merchant-approvals',
        labelKey: 'sidebar.merchant_approvals',
        group: 'Merchants',
        description: 'Review merchant applications, approve or reject merchants, and manage merchant activation.',
    },
    {
        key: 'page:subscription-plans',
        path: '/subscription-plans',
        labelKey: 'sidebar.subscription_plans',
        group: 'Subscriptions',
        description: 'Create, update, disable, and delete subscription plans.',
    },
    {
        key: 'page:subscriptions',
        path: '/subscriptions',
        labelKey: 'sidebar.subscriptions',
        group: 'Subscriptions',
        description: 'Monitor merchant subscriptions and open subscription details.',
    },
    {
        key: 'page:subscription-payment-requests',
        path: '/subscription-payment-requests',
        labelKey: 'sidebar.payment_requests',
        group: 'Subscriptions',
        description: 'Approve or reject merchant subscription payment requests.',
    },
    {
        key: 'page:audit-log',
        path: '/audit-log',
        labelKey: 'sidebar.audit_log',
        group: 'Governance',
        description: 'View audit activity across admin operations.',
    },
    {
        key: 'page:payment-methods',
        path: '/payment-methods',
        labelKey: 'sidebar.payment_methods',
        group: 'Settings',
        description: 'Manage payment methods shown to merchants.',
    },
    {
        key: 'page:categories',
        path: '/categories',
        labelKey: 'sidebar.categories',
        group: 'Catalog',
        description: 'Manage market sectors, master categories, images, ordering, and activation.',
    },
    {
        key: 'page:staff',
        path: '/staff',
        labelKey: 'sidebar.staff',
        group: 'Team',
        description: 'Create admin staff, assign roles, change roles, and remove staff.',
    },
    {
        key: 'page:roles-permissions',
        path: '/roles-permissions',
        labelKey: 'sidebar.roles_permissions',
        group: 'Team',
        description: 'Create roles and configure page-level permissions.',
    },
    {
        key: 'page:promos',
        path: '/promos',
        labelKey: 'sidebar.promos',
        group: 'Marketing',
        description: 'Manage admin-level promo codes.',
    },
    {
        key: 'page:announcements',
        path: '/announcements',
        labelKey: 'sidebar.announcements',
        group: 'Marketing',
        description: 'Create, toggle, and delete announcements.',
    },
    {
        key: 'page:settings',
        path: '/settings',
        labelKey: 'sidebar.settings',
        group: 'Settings',
        description: 'Edit global platform settings.',
    },
    {
        key: 'page:security',
        path: '/security',
        labelKey: 'sidebar.security',
        group: 'Settings',
        description: 'Change the signed-in admin account password.',
    },
    {
        key: 'page:chats',
        path: '/chats',
        labelKey: 'sidebar.chats',
        group: 'Support',
        description: 'Open admin support conversations with merchants.',
    },
    {
        key: 'page:delivery-network',
        path: '/delivery-network',
        labelKey: 'sidebar.delivery_network',
        group: 'Delivery',
        description: 'Manage delivery offices, delivery agents, commissions, and active delivery assignments.',
    },
    {
        key: 'page:delivery-agents',
        path: '/delivery-agents',
        labelKey: 'sidebar.delivery_agents',
        group: 'Delivery',
        description: 'View delivery agents (pilots) and their outstanding owed cash balances.',
    },
    {
        key: 'page:delivery-payment-requests',
        path: '/delivery-payment-requests',
        labelKey: 'sidebar.delivery_payment_requests',
        group: 'Delivery',
        description: 'Approve or reject pilot cash settlement payment requests.',
    },
];

export const getFirstAllowedAdminPath = (
    permissions: string[],
    isSystemAdmin: boolean
) => {
    if (isSystemAdmin || permissions.includes('page:*')) return '/dashboard';
    return ADMIN_PAGE_PERMISSIONS.find((page) => permissions.includes(page.key))?.path || '/login';
};
