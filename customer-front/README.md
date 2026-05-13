# CityOrders Customer App

A complete mobile application for customers using Expo, React Native, and TypeScript.

## Features

- **Authentication**: JWT-based login and registration.
- **Catalog Browsing**: Browse categories, brands, and products.
- **Global Offers**: View time-limited offers with countdown timers.
- **Multi-brand Cart**: Group items by brand and checkout per brand.
- **Distance-based Delivery**: Automatic delivery fee calculation using GPS business rules.
- **Order Tracking**: Live order status polling (10s list, 5s details).
- **Address Management**: GPS-enabled address creation and management.
- **Payment**: Cash on Delivery (COD) only.

## Tech Stack

- **Framework**: Expo (React Native Router)
- **UI**: React Native Paper (Material Design)
- **Data Fetching**: TanStack Query (React Query)
- **State Management**: Zustand (for persistent cart)
- **Validation**: Zod + React Hook Form
- **Utilities**: Axios, Day.js, Lucide Icons

## Setup & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://localhost:5014/api
   ```
   *Note: For Android Emulator, use `http://10.0.2.2:5014/api`.*

3. **Start the App**:
   ```bash
   npx expo start
   ```

## Development

- **API Documentation**: [Swagger UI](http://localhost:5014/swagger)
- **Testing**: Run on an emulator or physical device using the Expo Go app.
