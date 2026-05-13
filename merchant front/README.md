# Merchant Mobile App (City Orders)

A React Native mobile application for merchants to manage their stores, products, and orders.

## Features
- **Authentication**: JWT-based login with secure token storage.
- **Onboarding**: Simple application flow for new merchants.
- **Dashboard**: Real-time sales and product overview.
- **Product Management**: Grouped and filtered view of products by category.
- **Categories**: Organize products into custom categories with conflict protection.
- **Order Management**: Real-time status updates (Accept, Prepare, Deliver).
- **Invoices / Settlements**: Generate daily settlement invoices with PDF export.
- **Subscription Support**: Role-based access control and renewal management.
- **Auto-Lock**: Features are disabled automatically if the subscription is expired.

## Key Features
### Categories Feature
The app now supports product categorization.
- **Create/Edit**: Manage your custom categories.
- **Grouping**: Products are automatically grouped by category in the products list.
- **Delete Protection**: Categories containing products cannot be deleted (returns a friendly warning) to prevent accidental data loss.

### Invoices / Settlements Feature
Merchants can generate settlement invoices for delivered orders.

#### Shift Management
- **Start Day**: Begin a new shift to track delivered orders.
- **Close Day**: End the shift and generate an immutable invoice snapshot.
- Only one shift can be open at a time per brand.

#### Invoice Features
- **Filter by Time Range**: Use preset filters (24h, 7d, 30d, 90d) or custom date range.
- **Invoice Details**: View summarized line items grouped by product + individual orders.
- **PDF Export**: Download and share invoice PDFs via the native share sheet.

#### Subscription Rules
- **Active/Grace**: Full access to start/close shifts and view/download invoices.
- **Expired**: Read-only access. Can view and download invoices, but cannot start or close shifts.

## Tech Stack
- Expo (React Native) + TypeScript
- Expo Router (File-based navigation)
- TanStack Query (API fetching & caching)
- Axios (HTTP client with JWT interceptors)
- React Native Paper (Material Design UI)
- React Hook Form + Zod (Validation)
- Expo SecureStore (Token security)
- Expo Image Picker (Proof/Product photo selection)

## Setup

### 1. Prerequisites
- Node.js (v18+)
- Expo Go app on your phone OR Android/iOS Emulator

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5014/api
```
*Note: Use `http://10.0.2.2:5014/api` if running on an Android Emulator.*

### 4. Running the App
```bash
npx expo start
```
Press `a` for Android or `i` for iOS.

## Folder Structure
- `app/`: Expo Router screens and layouts.
- `src/api/`: Axios client and Query settings.
- `src/auth/`: Authentication context and storage.
- `src/components/`: Reusable UI components.
- `src/hooks/`: Custom React hooks for data fetching.
- `src/utils/`: Logic helpers (e.g., subscription state).
- `src/types/`: TypeScript interfaces.

## Testing
```bash
npm test
```
