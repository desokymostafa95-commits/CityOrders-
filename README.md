# CityOrders - Full-Stack Delivery Ecosystem

CityOrders is a comprehensive multi-platform delivery and e-commerce solution. It features a robust backend API and specialized frontend applications for customers, merchants, and administrators.

## 🚀 Project Structure

This repository is a monorepo containing the following components:

- **`CityOrders.Api`**: A .NET Core Web API providing the core logic, database management (SQL Server), and JWT authentication.
- **`customer-front`**: An Expo-based mobile/web application for customers to browse products and place orders.
- **`merchant front`**: A dedicated application for business owners to manage their brands, products, and incoming orders.
- **`admin front`**: A management dashboard for platform administrators to oversee the entire ecosystem.

## 🛠️ Technology Stack

- **Backend**: .NET Core, Entity Framework Core, SQL Server.
- **Frontends**: React Native (Expo), React (Web), TypeScript.
- **Authentication**: JWT (JSON Web Tokens).

## 🏁 Getting Started

### Prerequisites
- [.NET SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/)
- [SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (or LocalDB)

### Setup Instructions

1. **Database Configuration**
   - Update the connection string in `CityOrders.Api/appsettings.json`.
   - Run migrations or use the provided SQL scripts to set up the schema.

2. **Run the API**
   ```bash
   cd CityOrders.Api
   dotnet run
   ```

3. **Run the Frontends**
   Each frontend can be started using npm or yarn:
   ```bash
   cd "customer-front"
   npm install
   npx expo start
   ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
