# CityOrders Admin Dashboard

Modern web application for managing CityOrders merchants, payments, and global settings.

## Stack
- React + TypeScript (Vite)
- React Router
- TanStack Query
- Axios (with interceptors)
- TailwindCSS
- Lucide React (Icons)
- Sonner (Toast notifications)

## Prerequisites
- Node.js (v18+)
- CityOrders API running locally or accessible via network

## Setup
1. Clone the repository (if not already done).
2. Navigate to `admin front` folder.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory and add your API base URL:
   ```env
   VITE_API_BASE_URL=http://localhost:5014/api
   ```

## Running the App
```bash
npm run dev
```

## Features
- **Merchant Approvals**: Review and approve new merchant registrations.
- **Subscription Payment Requests**: Verify payment proofs and activate subscriptions.
- **Payment Methods**: Manage global payment methods for merchants.
- **Subscription Plans**: Configure Monthly, Quarterly, and Yearly plans.
- **Global Settings**: Toggle Free Trial and configure trial/grace days.
