# Asa Medchem — Inventory & Order Management System

A high-precision, full-stack inventory and order management platform built for chemical, scientific, and general warehousing businesses. Supports dual roles — **Admin** and **Seller** — with real-time unit conversion pricing, cart-based ordering, and a full order lifecycle.

🌐 **Live Demo**: [https://aasamedchem-mu.vercel.app](https://aasamedchem-mu.vercel.app)

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2.7 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Database** | Neon PostgreSQL (Serverless) |
| **ORM** | Prisma ORM v5 (`NUMERIC(20,8)` precision) |
| **Authentication** | NextAuth.js v4 (Credentials Provider + JWT) |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Forms** | React Hook Form + Zod validation |
| **Notifications** | react-hot-toast |
| **Icons** | lucide-react |
| **Deploy Target** | Vercel |

---

## 🏗️ Architecture & System Design

```
                     ┌──────────────────┐
                     │   Client (Web)   │
                     └────────┬─────────┘
                              │
                     ┌────────▼─────────┐
                     │  Proxy Middleware │ (NextAuth session + role guard)
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
                     │    API Routes    │ (Unit conversions & validations)
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

### Enums

**`Role`**: `ADMIN` | `USER`

**`Unit`**: `g` (Grams) | `kg` (Kilograms) | `mL` (Milliliters) | `L` (Liters) | `unit` (Count)

**`OrderStatus`**: `PENDING` | `CONFIRMED` | `REJECTED`

---

### `users`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary Key |
| `email` | VARCHAR | Unique |
| `password` | VARCHAR | Hashed via bcryptjs |
| `role` | Role | Defaults to `USER` |
| `name` | VARCHAR | |
| `createdAt` | Timestamp | |

### `products`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary Key |
| `name` | VARCHAR | |
| `sku` | VARCHAR | Unique |
| `description` | TEXT | Nullable |
| `category` | VARCHAR | |
| `baseUnit` | Unit | Storage unit (g, mL, unit) |
| `basePrice` | NUMERIC(20,8) | Price per 1 baseUnit in INR |
| `stock` | NUMERIC(20,8) | Remaining quantity in baseUnit |
| `isActive` | BOOLEAN | Defaults to `true` |
| `createdAt` | Timestamp | |
| `updatedAt` | Timestamp | |

### `orders`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary Key |
| `userId` | UUID | FK → `users.id` |
| `status` | OrderStatus | Defaults to `PENDING` |
| `totalAmount` | NUMERIC(20,8) | Total in INR |
| `notes` | TEXT | Nullable |
| `createdAt` | Timestamp | |
| `updatedAt` | Timestamp | |

### `order_items`
| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary Key |
| `orderId` | UUID | FK → `orders.id` |
| `productId` | UUID | FK → `products.id` |
| `orderedUnit` | Unit | Unit chosen by buyer (e.g. kg, L) |
| `orderedQty` | NUMERIC(20,8) | Qty in ordered unit |
| `storedQty` | NUMERIC(20,8) | Qty converted to baseUnit (deducted from stock) |
| `unitPrice` | NUMERIC(20,8) | Converted price per 1 ordered unit |
| `lineTotal` | NUMERIC(20,8) | `orderedQty × unitPrice` |

---

## ⚖️ Unit Conversion Strategy

### Core Principles
1. **Weight products** are stored in grams (`g`).
2. **Volume products** are stored in milliliters (`mL`).
3. **Count products** are stored in counts (`unit`).
4. **Base prices** are always per 1 baseUnit (e.g. INR/g, INR/mL).

### Conversion Map (`/lib/units.ts`)
```typescript
const CONVERSION_TO_BASE: Record<string, Record<string, number>> = {
  g:    { g: 1,     kg: 1000  },
  kg:   { g: 0.001, kg: 1     },
  mL:   { mL: 1,   L: 1000   },
  L:    { mL: 0.001, L: 1    },
  unit: { unit: 1             },
}
```

### Example — Ordering 2 kg of a product stored in grams
| Calc | Formula | Result |
|---|---|---|
| Conversion factor | `CONVERSION_TO_BASE["g"]["kg"]` | `1000` |
| Stored quantity | `2 kg × 1000` | `2000 g` (deducted from stock) |
| Unit price | `basePrice (INR/g) × 1000` | e.g. `10,000 INR/kg` |
| Line total | `2 × 10,000` | `20,000 INR` |

Prices recalculate **client-side in real-time** as the buyer changes units or quantities, and are re-validated **server-side** before committing.

---

## 🔑 Access Roles

| Role | Accessible Areas | Order Placement |
|---|---|---|
| **ADMIN** | `/admin/*` and `/dashboard/*` | ❌ Cannot place orders (popup shown) |
| **USER (Seller)** | `/dashboard/*` only | ✅ Can place orders |

> **Note:** Admin accounts are redirected from `/admin/*` if accessed by a USER role, and sellers are redirected out of `/admin/*`. Admins viewing the order page see an "Access Denied" popup if they attempt to submit.

---

## 💻 Local Setup

### 1. Clone & Install
```bash
git clone https://github.com/Charan57290/Aasamedchem.git
cd Aasamedchem
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root:
```env
DATABASE_URL="your-neon-postgres-connection-string"
NEXTAUTH_SECRET="your-random-secret-string"
NEXTAUTH_URL="http://localhost:3000"
```

> ⚠️ **Never commit your `.env` file.** It is excluded via `.gitignore`.

### 3. Sync Database & Seed
```bash
# Generate Prisma Client and push schema to Neon
npx prisma generate
npx prisma db push

# Seed initial users & product catalog
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Vercel Deployment

The app is live and deployed on Vercel:

🌐 **[https://aasamedchem-mu.vercel.app](https://aasamedchem-mu.vercel.app)**

---


## 📖 Feature Guide

### Admin Panel (`/admin`)

| Page | Path | Description |
|---|---|---|
| Products | `/admin/products` | Add, edit, or soft-delete catalog items. Set base prices and starting stock. Mark inactive to hide from sellers. |
| Orders | `/admin/orders` | Review pending orders. Confirm to finalize (stock deducted) or Reject to release reserved stock. |
| Inventory | `/admin/inventory` | View total stock in base units. Rows highlight in amber/red with a "Low Stock" badge when below threshold. |

### Seller Panel (`/dashboard`)

| Page | Path | Description |
|---|---|---|
| Browse Catalog | `/dashboard/products` | Filter by category, search by SKU/name. Shows prices, stock, and compatible units. |
| Place Order | `/dashboard/order/new` | Add items to cart, choose units, enter quantities. Real-time price recalculation. Add notes and submit. |
| Order History | `/dashboard/orders` | Track status of all orders. View detailed receipt breakdowns per item. |

---

## 📝 Scripts Reference

| Script | Command | Description |
|---|---|---|
| Dev server | `npm run dev` | Starts Next.js dev server with Turbopack |
| Production build | `npm run build` | Runs `prisma generate` then `next build` |
| Start production | `npm start` | Serves the production build |
| Lint | `npm run lint` | Runs ESLint |
| Seed database | `npx prisma db seed` | Seeds users and products |
| Push schema | `npx prisma db push` | Syncs Prisma schema to the database |

---

## 📁 Project Structure

```
Aasamedchem/
├── app/
│   ├── admin/           # Admin panel pages (products, orders, inventory)
│   ├── api/             # API routes (auth, products, orders)
│   ├── dashboard/       # Seller panel pages (catalog, order, history)
│   ├── login/           # Login page
│   └── register/        # Registration page
├── components/          # Reusable UI components (shadcn/ui based)
├── lib/                 # Shared utilities (auth, db, units conversion)
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seed script
├── types/               # TypeScript type definitions
├── middleware.ts        # NextAuth session + route protection
└── .env                 # Environment variables (not committed)
```
