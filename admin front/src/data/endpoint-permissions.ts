export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type Role = 'Admin' | 'Merchant' | 'Customer' | 'Delivery' | 'Public';

export interface Endpoint {
  group: string;
  method: HttpMethod;
  path: string;
  description: string;
  roles: Role[];
  notes?: string;
}

export const ENDPOINTS: Endpoint[] = [
  // ─── Auth ────────────────────────────────────────────────────────────────────
  {
    group: 'Auth',
    method: 'POST',
    path: '/api/auth/register/customer',
    description: 'Register a new customer account',
    roles: ['Public'],
  },
  {
    group: 'Auth',
    method: 'POST',
    path: '/api/auth/login',
    description: 'Login and receive JWT token',
    roles: ['Public'],
  },

  // ─── Catalog (Public) ────────────────────────────────────────────────────────
  {
    group: 'Catalog',
    method: 'GET',
    path: '/api/catalog/categories',
    description: 'List all active master categories',
    roles: ['Public'],
  },
  {
    group: 'Catalog',
    method: 'GET',
    path: '/api/catalog/brands',
    description: 'List active brands currently on shift',
    roles: ['Public'],
  },
  {
    group: 'Catalog',
    method: 'GET',
    path: '/api/catalog/brands/{brandId}',
    description: 'Get a single brand details',
    roles: ['Public'],
  },
  {
    group: 'Catalog',
    method: 'GET',
    path: '/api/catalog/brands/{brandId}/products',
    description: 'List products for a brand',
    roles: ['Public'],
  },
  {
    group: 'Catalog',
    method: 'GET',
    path: '/api/catalog/brands/{brandId}/delivery-quote',
    description: 'Get delivery fee quote for customer address',
    roles: ['Customer'],
  },
  {
    group: 'Catalog',
    method: 'GET',
    path: '/api/catalog/subscribed-brands',
    description: 'List brands with active subscriptions',
    roles: ['Public'],
  },
  {
    group: 'Catalog',
    method: 'GET',
    path: '/api/catalog/offers',
    description: 'Get all currently active offers from visible brands',
    roles: ['Public'],
  },

  // ─── Admin — Create ──────────────────────────────────────────────────────────
  {
    group: 'Admin — Account',
    method: 'POST',
    path: '/api/admin/create-admin',
    description: 'Create an admin user (Dev only if no admin exists)',
    roles: ['Admin', 'Public'],
    notes: 'Public only when no admin exists & in Development',
  },

  // ─── Admin — Merchants ───────────────────────────────────────────────────────
  {
    group: 'Admin — Merchants',
    method: 'GET',
    path: '/api/admin/merchant-applications',
    description: 'List merchant applications by status (pending/approved/rejected)',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Merchants',
    method: 'POST',
    path: '/api/admin/approve-merchant/{userId}',
    description: 'Approve a merchant application',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Merchants',
    method: 'POST',
    path: '/api/admin/reject-merchant/{userId}',
    description: 'Reject a merchant application with reason',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Merchants',
    method: 'POST',
    path: '/api/admin/merchants/{merchantId}/activate',
    description: 'Manually activate a merchant profile',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Merchants',
    method: 'POST',
    path: '/api/admin/merchants/{merchantId}/deactivate',
    description: 'Manually deactivate a merchant (closes open shifts)',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Merchants',
    method: 'POST',
    path: '/api/admin/merchants/{userId}/categories',
    description: 'Update master categories assigned to a merchant',
    roles: ['Admin'],
  },

  // ─── Admin — Subscriptions ───────────────────────────────────────────────────
  {
    group: 'Admin — Subscriptions',
    method: 'GET',
    path: '/api/admin/subscription-plans',
    description: 'List all subscription plans',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Subscriptions',
    method: 'POST',
    path: '/api/admin/subscription-plans',
    description: 'Create a new subscription plan',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Subscriptions',
    method: 'PUT',
    path: '/api/admin/subscription-plans/{id}',
    description: 'Update a subscription plan',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Subscriptions',
    method: 'PATCH',
    path: '/api/admin/subscription-plans/{id}/toggle',
    description: 'Enable or disable a subscription plan',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Subscriptions',
    method: 'DELETE',
    path: '/api/admin/subscription-plans/{id}',
    description: 'Delete a plan and its associated subscriptions',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Subscriptions',
    method: 'GET',
    path: '/api/admin/payment-requests',
    description: 'List payment requests by status',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Subscriptions',
    method: 'POST',
    path: '/api/admin/payment-requests/{id}/approve',
    description: 'Approve a payment request and activate subscription',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Subscriptions',
    method: 'POST',
    path: '/api/admin/payment-requests/{id}/reject',
    description: 'Reject a payment request with reason',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Subscriptions',
    method: 'GET',
    path: '/api/admin/subscriptions-monitoring',
    description: 'Monitor merchant subscriptions (filter by state)',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Subscriptions',
    method: 'GET',
    path: '/api/admin/merchants/{userId}/subscription',
    description: 'Get full subscription details for a merchant',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Subscriptions',
    method: 'POST',
    path: '/api/admin/subscriptions/{userId}/extend',
    description: 'Manually extend a merchant subscription',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Subscriptions',
    method: 'POST',
    path: '/api/admin/subscriptions/{userId}/force-expire',
    description: 'Force-expire a merchant subscription immediately',
    roles: ['Admin'],
  },

  // ─── Admin — Categories ──────────────────────────────────────────────────────
  {
    group: 'Admin — Master Categories',
    method: 'GET',
    path: '/api/admincategory/categories',
    description: 'List all master categories (including inactive)',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Master Categories',
    method: 'POST',
    path: '/api/admincategory/categories',
    description: 'Create a new master category',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Master Categories',
    method: 'PUT',
    path: '/api/admincategory/categories/{id}',
    description: 'Update a master category',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Master Categories',
    method: 'DELETE',
    path: '/api/admincategory/categories/{id}',
    description: 'Delete a master category',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Master Categories',
    method: 'PATCH',
    path: '/api/admincategory/categories/{id}/toggle',
    description: 'Toggle category active/inactive',
    roles: ['Admin'],
  },

  // ─── Admin — Settings ────────────────────────────────────────────────────────
  {
    group: 'Admin — Settings',
    method: 'GET',
    path: '/api/adminsettings/settings',
    description: 'Get global app settings (free trial config, etc.)',
    roles: ['Admin'],
  },
  {
    group: 'Admin — Settings',
    method: 'PUT',
    path: '/api/adminsettings/settings',
    description: 'Update global app settings',
    roles: ['Admin'],
  },

  // ─── Admin — Audit ───────────────────────────────────────────────────────────
  {
    group: 'Admin — Audit',
    method: 'GET',
    path: '/api/admin/audit',
    description: 'Get audit log (filter by type, date range, paginated)',
    roles: ['Admin'],
  },

  // ─── Payment Methods ─────────────────────────────────────────────────────────
  {
    group: 'Payment Methods',
    method: 'GET',
    path: '/api/paymentmethods/payments/methods',
    description: 'List active payment methods',
    roles: ['Public'],
  },
  {
    group: 'Payment Methods',
    method: 'GET',
    path: '/api/paymentmethods/admin/payments/methods',
    description: 'List all payment methods (Admin view)',
    roles: ['Admin'],
  },
  {
    group: 'Payment Methods',
    method: 'POST',
    path: '/api/paymentmethods/admin/payments/methods',
    description: 'Create a new payment method',
    roles: ['Admin'],
  },
  {
    group: 'Payment Methods',
    method: 'PUT',
    path: '/api/paymentmethods/admin/payments/methods/{id}',
    description: 'Update a payment method',
    roles: ['Admin'],
  },
  {
    group: 'Payment Methods',
    method: 'PATCH',
    path: '/api/paymentmethods/admin/payments/methods/{id}/toggle',
    description: 'Toggle payment method active/inactive',
    roles: ['Admin'],
  },
  {
    group: 'Payment Methods',
    method: 'DELETE',
    path: '/api/paymentmethods/admin/payments/methods/{id}',
    description: 'Delete a payment method',
    roles: ['Admin'],
  },

  // ─── Merchant — Profile ──────────────────────────────────────────────────────
  {
    group: 'Merchant — Profile',
    method: 'POST',
    path: '/api/merchant/apply-anon',
    description: 'Anonymous merchant application (no auth required)',
    roles: ['Public'],
  },
  {
    group: 'Merchant — Profile',
    method: 'POST',
    path: '/api/merchant/apply',
    description: 'Authenticated merchant application',
    roles: ['Admin', 'Merchant', 'Customer', 'Delivery'],
    notes: 'Any authenticated user',
  },
  {
    group: 'Merchant — Profile',
    method: 'GET',
    path: '/api/merchant/brand',
    description: 'Get own brand details',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Profile',
    method: 'PUT',
    path: '/api/merchant/brand',
    description: 'Update own brand details',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Profile',
    method: 'POST',
    path: '/api/merchant/brand/logo',
    description: 'Upload brand logo image',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Profile',
    method: 'GET',
    path: '/api/merchant/brand/location',
    description: 'Get brand GPS location',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Profile',
    method: 'PUT',
    path: '/api/merchant/brand/location',
    description: 'Update brand GPS location',
    roles: ['Merchant'],
  },

  // ─── Merchant — Products ─────────────────────────────────────────────────────
  {
    group: 'Merchant — Products',
    method: 'GET',
    path: '/api/merchant/products',
    description: 'List own products',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Products',
    method: 'POST',
    path: '/api/merchant/products',
    description: 'Create a new product',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Products',
    method: 'PUT',
    path: '/api/merchant/products/{id}',
    description: 'Update a product',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Products',
    method: 'DELETE',
    path: '/api/merchant/products/{id}',
    description: 'Soft-delete a product',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Products',
    method: 'POST',
    path: '/api/merchant/products/{id}/photos',
    description: 'Upload product photos',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Products',
    method: 'DELETE',
    path: '/api/merchant/products/{productId}/photos/{photoId}',
    description: 'Delete a product photo',
    roles: ['Merchant'],
  },

  // ─── Merchant — Categories ───────────────────────────────────────────────────
  {
    group: 'Merchant — Categories',
    method: 'GET',
    path: '/api/merchantcategories',
    description: 'List own brand product categories',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Categories',
    method: 'POST',
    path: '/api/merchantcategories',
    description: 'Create a brand product category',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Categories',
    method: 'PUT',
    path: '/api/merchantcategories/{id}',
    description: 'Update a brand product category',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Categories',
    method: 'DELETE',
    path: '/api/merchantcategories/{id}',
    description: 'Delete a brand product category',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Categories',
    method: 'PATCH',
    path: '/api/merchantcategories/{id}/sort',
    description: 'Update sort order of a category',
    roles: ['Merchant'],
  },

  // ─── Merchant — Offers ───────────────────────────────────────────────────────
  {
    group: 'Merchant — Offers',
    method: 'GET',
    path: '/api/merchantoffers',
    description: 'List all offers for own brand',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Offers',
    method: 'GET',
    path: '/api/merchantoffers/current',
    description: 'List currently active offers',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Offers',
    method: 'GET',
    path: '/api/merchantoffers/limit',
    description: 'Get offer slot limit from subscription',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Offers',
    method: 'POST',
    path: '/api/merchantoffers',
    description: 'Create a new offer',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Offers',
    method: 'PUT',
    path: '/api/merchantoffers/{id}',
    description: 'Update an offer',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Offers',
    method: 'DELETE',
    path: '/api/merchantoffers/{id}',
    description: 'Delete an offer',
    roles: ['Merchant'],
  },

  // ─── Merchant — Availability ─────────────────────────────────────────────────
  {
    group: 'Merchant — Availability',
    method: 'GET',
    path: '/api/merchantavailability/status',
    description: 'Get shift and temporary close status',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Availability',
    method: 'POST',
    path: '/api/merchantavailability/shift/toggle',
    description: 'Start or stop shift (open/close)',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Availability',
    method: 'POST',
    path: '/api/merchantavailability/temporary-close',
    description: 'Temporarily close with reason and until time',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Availability',
    method: 'DELETE',
    path: '/api/merchantavailability/temporary-close',
    description: 'Re-open from temporary close',
    roles: ['Merchant'],
  },

  // ─── Merchant — Subscription ─────────────────────────────────────────────────
  {
    group: 'Merchant — Subscription',
    method: 'GET',
    path: '/api/merchantsubscription/plans',
    description: 'List available subscription plans',
    roles: ['Admin', 'Merchant', 'Customer', 'Delivery'],
    notes: 'Any authenticated user',
  },
  {
    group: 'Merchant — Subscription',
    method: 'GET',
    path: '/api/merchantsubscription/status',
    description: 'Get own subscription status',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Subscription',
    method: 'POST',
    path: '/api/merchantsubscription/trial/activate',
    description: 'Activate free trial subscription',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Subscription',
    method: 'POST',
    path: '/api/merchantsubscription/payment-request',
    description: 'Submit a subscription payment request with proof',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Subscription',
    method: 'GET',
    path: '/api/merchantsubscription/payment-requests',
    description: 'List own payment request history',
    roles: ['Merchant'],
  },

  // ─── Merchant — Shifts & Invoices ────────────────────────────────────────────
  {
    group: 'Merchant — Shifts & Invoices',
    method: 'GET',
    path: '/api/merchantinvoices/shift/current',
    description: 'Get current open shift details',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Shifts & Invoices',
    method: 'POST',
    path: '/api/merchantinvoices/shift/start',
    description: 'Start a new shift',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Shifts & Invoices',
    method: 'POST',
    path: '/api/merchantinvoices/shift/close',
    description: 'Close current shift and generate invoice',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Shifts & Invoices',
    method: 'GET',
    path: '/api/merchantinvoices',
    description: 'List past shift invoices (paginated)',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Shifts & Invoices',
    method: 'GET',
    path: '/api/merchantinvoices/{id}',
    description: 'Get a specific invoice details',
    roles: ['Merchant'],
  },
  {
    group: 'Merchant — Shifts & Invoices',
    method: 'GET',
    path: '/api/merchantinvoices/{id}/pdf',
    description: 'Download invoice as PDF',
    roles: ['Merchant'],
  },

  // ─── Orders ──────────────────────────────────────────────────────────────────
  {
    group: 'Orders',
    method: 'POST',
    path: '/api/order',
    description: 'Place a new order',
    roles: ['Customer'],
  },
  {
    group: 'Orders',
    method: 'GET',
    path: '/api/order',
    description: 'Get own order history',
    roles: ['Customer'],
  },
  {
    group: 'Orders',
    method: 'GET',
    path: '/api/order/{id}',
    description: 'Get order details by ID',
    roles: ['Customer'],
  },
  {
    group: 'Orders',
    method: 'PUT',
    path: '/api/order/{id}/cancel',
    description: 'Cancel a pending order',
    roles: ['Customer'],
  },
  {
    group: 'Orders',
    method: 'GET',
    path: '/api/order/merchant/pending',
    description: 'Get pending orders for merchant brand',
    roles: ['Merchant'],
  },
  {
    group: 'Orders',
    method: 'PUT',
    path: '/api/order/merchant/{id}/status',
    description: 'Update order status (accept/preparing/etc.)',
    roles: ['Merchant'],
  },

  // ─── Customer — Profile ──────────────────────────────────────────────────────
  {
    group: 'Customer — Profile',
    method: 'GET',
    path: '/api/customer/me',
    description: 'Get own profile details and roles',
    roles: ['Admin', 'Merchant', 'Customer', 'Delivery'],
    notes: 'Any authenticated user',
  },
  {
    group: 'Customer — Profile',
    method: 'GET',
    path: '/api/customer/addresses',
    description: 'List own saved addresses',
    roles: ['Customer'],
  },
  {
    group: 'Customer — Profile',
    method: 'POST',
    path: '/api/customer/addresses',
    description: 'Add a new address',
    roles: ['Customer'],
  },
  {
    group: 'Customer — Profile',
    method: 'PUT',
    path: '/api/customer/addresses/{id}',
    description: 'Update an address',
    roles: ['Customer'],
  },
  {
    group: 'Customer — Profile',
    method: 'DELETE',
    path: '/api/customer/addresses/{id}',
    description: 'Delete an address',
    roles: ['Customer'],
  },
  {
    group: 'Customer — Profile',
    method: 'PUT',
    path: '/api/customer/addresses/{id}/default',
    description: 'Set address as default',
    roles: ['Customer'],
  },
];

export const ALL_GROUPS = [...new Set(ENDPOINTS.map((e) => e.group))];
export const ALL_ROLES: Role[] = ['Admin', 'Merchant', 'Customer', 'Delivery', 'Public'];
