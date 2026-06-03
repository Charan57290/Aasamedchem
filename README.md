# Asa Medchem - Inventory & Order Management System

A high-precision full-stack inventory and order management system built for scientific, chemical, and general warehousing applications. 

---

## 🚀 Tech Stack
- **Framework**: Next.js 14 / 16 (App Router)
- **Database**: Neon PostgreSQL (Serverless Postgres)
- **ORM**: Prisma ORM
- **Authentication**: NextAuth.js (Credentials Provider + JWT Strategy)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Precision Math**: Prisma's `Decimal` type mapping to PostgreSQL `NUMERIC(20, 8)`
- **Deploy Target**: Vercel

---

## 🎨 Architecture & System Design

```
                     ┌──────────────────┐
                     │   Client (Web)   │
                     └────────┬─────────┘
                              │
                     ┌────────▼─────────┐
                     │    Middleware    │ (NextAuth session checking)
                     └────────┬─────────┘
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
   ┌────────▼────────┐                 ┌────────▼────────┐
   │   Admin Panel   │                 │  Seller Panel   │
   │  (/admin/*)     │                 │ (/dashboard/*)  │
   └────────┬────────┘                 └────────┬────────┘
            │                                   │
            └─────────────────┬─────────────────┘
                              │
                     ┌────────▼─────────┐
                     │    API Routes    │ (Conversions & Validations)
                     │    (/api/*)      │
                     └────────┬─────────┘
                              │
                     ┌────────▼─────────┐
                     │    Prisma ORM    │ (Decimal.js high-precision math)
                     └────────┬─────────┘
                              │
                     ┌────────▼─────────┐
                     │  Neon Postgres   │ (NUMERIC(20, 8) storage)
                     └──────────────────┘
```

---

## 🗄️ Database Schema

### `Role` (Enum)
- `ADMIN`
- `USER`

### `Unit` (Enum)
- `g` (Grams)
- `kg` (Kilograms)
- `mL` (Milliliters)
- `L` (Liters)
- `unit` (Count)

### `OrderStatus` (Enum)
- `PENDING`
- `CONFIRMED`
- `REJECTED`

### `users`
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password` (Hashed VARCHAR via bcryptjs)
- `role` (Role Enum, defaults to `USER`)
- `name` (VARCHAR)
- `createdAt` (Timestamp)

### `products`
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `sku` (VARCHAR, Unique)
- `description` (TEXT, Nullable)
- `category` (VARCHAR)
- `baseUnit` (Unit Enum)
- `basePrice` (NUMERIC(20, 8)) — Price per 1 `baseUnit` in INR
- `stock` (NUMERIC(20, 8)) — Quantity remaining in `baseUnit`
- `isActive` (BOOLEAN, defaults to `true`)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### `orders`
- `id` (UUID, Primary Key)
- `userId` (FK -> `users.id`)
- `status` (OrderStatus Enum, defaults to `PENDING`)
- `totalAmount` (NUMERIC(20, 8)) — Total order cost in INR
- `notes` (TEXT, Nullable)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### `order_items`
- `id` (UUID, Primary Key)
- `orderId` (FK -> `orders.id`)
- `productId` (FK -> `products.id`)
- `orderedUnit` (Unit Enum) — Unit selected by the buyer (e.g., kg, L)
- `orderedQty` (NUMERIC(20, 8)) — Qty in the ordered unit
- `storedQty` (NUMERIC(20, 8)) — Qty converted to `baseUnit` (what gets deducted/credited)
- `unitPrice` (NUMERIC(20, 8)) — Converted price per 1 ordered unit
- `lineTotal` (NUMERIC(20, 8)) — `orderedQty` * `unitPrice`

---

## ⚖️ Unit Storage & Conversion Strategy

### Core Principles
1. **Weight products** are stored in grams (`g`).
2. **Volume products** are stored in milliliters (`mL`).
3. **Count products** are stored in counts (`unit`).
4. **Base Prices** in `products` are always represented per 1 baseUnit (e.g., price per gram, price per milliliter).

### Conversion Map (`/lib/units.ts`)
Conversions are governed by a statically declared lookup map:
```typescript
const CONVERSION_TO_BASE: Record<string, Record<string, number>> = {
  g: { g: 1, kg: 1000 },
  kg: { g: 0.001, kg: 1 },
  mL: { mL: 1, L: 1000 },
  L: { mL: 0.001, L: 1 },
  unit: { unit: 1 }
}
```

### Conversion Calculations (Order Placement / Display)
When a user selects a different unit (e.g. `kg` for a product stored in `g`), the conversion factor is calculated using `CONVERSION_TO_BASE[baseUnit][orderedUnit]`.
- **Conversion Factor**: `factor = 1000` (for g to kg)
- **Saved Storage Quantity**: `storedQty = orderedQty * factor` (e.g. `2 kg * 1000 = 2000 g`)
- **Fulfillment Unit Price**: `unitPrice = basePrice * factor` (e.g. `10 INR/g * 1000 = 10,000 INR/kg`)
- **Item Subtotal**: `lineTotal = orderedQty * unitPrice` (e.g. `2 * 10,000 = 20,000 INR`)

Conversions are done client-side for live pricing previews and verified on the server before committing transactions.

---

## 🔑 Test Credentials
Seed script inserts two default test accounts:

| Role | Email | Password | Allowed Directories |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@test.com` | `admin123` | `/admin/*` and `/dashboard/*` |
| **SELLER** | `seller@test.com` | `seller123` | `/dashboard/*` only (redirects out of `/admin/*`) |

---

## 💻 Local Setup Instructions

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/Charan57290/Aasamedchem.git
cd Aasamedchem

# Install package dependencies
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://neondb_owner:npg_ea6L1rwPlMVu@ep-damp-darkness-ape2rlu9.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="f3b9561de7d697843812739b61dbd83f47e30d10b7cd8061bd89e2193b2a2e88"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Sync Database & Seed Data
Generate the Prisma Client, sync models to Neon PostgreSQL, and seed the test credentials and catalog.
```bash
# Generate client and push schema
npx prisma generate
npx prisma db push

# Seed users & products
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Vercel Deployment Steps

1. Sign in to your [Vercel account](https://vercel.com).
2. Click **Add New** > **Project** and import your GitHub repository `Charan57290/Aasamedchem`.
3. Configure the following environment variables in the project setup:
   - `DATABASE_URL` = (Your Neon connection string)
   - `NEXTAUTH_SECRET` = (A secure random string)
   - `NEXTAUTH_URL` = (Your Vercel deployment URL, e.g., `https://aasamedchem.vercel.app`)
4. Click **Deploy**. Vercel will build the Next.js production bundle.
5. Setup the deployment lifecycle scripts. The default Next.js build works. You can configure Vercel's build command to automatically sync database schemas by setting:
   `prisma generate && prisma db push && next build`.

---

## 📖 Panel Guides

### 1. Admin Panel (`/admin`)
- **Manage Products (`/admin/products`)**: Add, edit, or delete items. Specify high-precision base unit prices and starting inventory counts. Mark items inactive to hide them from sellers.
- **Manage Orders (`/admin/orders`)**: View pending requests. Review details (displaying conversion values: ordered unit vs stored base unit). Click **Confirm Order** to finalize or **Reject Order** to release the reserved stock.
- **Stock Ledger (`/admin/inventory`)**: Review total inventory counts in base units. Rows drop to amber or red with a "Low Stock" badge when inventories fall below 15 units.

### 2. Seller/User Panel (`/dashboard`)
- **Browse Catalog (`/dashboard/products`)**: Filter by category or search SKU. Shows base prices, available stock levels, and compatible units.
- **Place Order (`/dashboard/order/new`)**: Search and add items to your cart. Select compatible units (e.g. L instead of mL) and type quantities. Prices, unit rates, and totals recalculate client-side in real-time. Input notes and submit.
- **Order History (`/dashboard/orders`)**: Monitor the status of current and past orders. Open statements to see detailed breakdown receipts.
