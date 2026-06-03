import { PrismaClient, Role, Unit } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // Clean the database
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Cleaned old records.");

  // Hash password
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const sellerPasswordHash = await bcrypt.hash("seller123", 10);

  // Create Users
  const admin = await prisma.user.create({
    data: {
      email: "admin@test.com",
      password: adminPasswordHash,
      name: "Admin User",
      role: Role.ADMIN,
    },
  });

  const seller = await prisma.user.create({
    data: {
      email: "seller@test.com",
      password: sellerPasswordHash,
      name: "Seller User",
      role: Role.USER,
    },
  });

  console.log(`Created users: Admin (${admin.email}), Seller (${seller.email})`);

  // Create Products
  const productsData = [
    {
      name: "Sodium Chloride (NaCl)",
      sku: "CHEM-NaCl-1KG",
      description: "Analytical grade Sodium Chloride, high purity compound.",
      category: "Chemicals",
      baseUnit: Unit.g,
      basePrice: 0.15, // 150 INR per kg => 0.15 INR per g
      stock: 50000.0, // 50 kg
      isActive: true,
    },
    {
      name: "Hydrochloric Acid (HCl) 37%",
      sku: "SOLV-HCl-1L",
      description: "Concentrated Hydrochloric Acid 37%, analytical reagent grade.",
      category: "Solvents",
      baseUnit: Unit.mL,
      basePrice: 0.45, // 450 INR per L => 0.45 INR per mL
      stock: 25000.0, // 25 L
      isActive: true,
    },
    {
      name: "Ethanol 99%",
      sku: "SOLV-EtOH-500",
      description: "Anhydrous Ethanol 99.9%, laboratory grade solvent.",
      category: "Solvents",
      baseUnit: Unit.mL,
      basePrice: 0.60, // 600 INR per L => 0.60 INR per mL
      stock: 10000.0, // 10 L
      isActive: true,
    },
    {
      name: "Digital Weighing Scale",
      sku: "EQP-DWS-01",
      description: "High precision digital weighing scale (0.001g to 500g accuracy).",
      category: "Equipment",
      baseUnit: Unit.unit,
      basePrice: 4500.0, // 4500 INR per unit
      stock: 10.0,
      isActive: true,
    },
    {
      name: "Glass Beaker 250mL",
      sku: "EQP-BEK-250",
      description: "Borosilicate glass beaker, 250mL capacity, heat resistant.",
      category: "Equipment",
      baseUnit: Unit.unit,
      basePrice: 180.0, // 180 INR per unit
      stock: 45.0,
      isActive: true,
    },
    {
      name: "Sodium Hydroxide (NaOH)",
      sku: "CHEM-NaOH-500",
      description: "Sodium Hydroxide pellets, pure grade reagent.",
      category: "Chemicals",
      baseUnit: Unit.g,
      basePrice: 0.35, // 350 INR per kg => 0.35 INR per g
      stock: 30000.0, // 30 kg
      isActive: true,
    },
    {
      name: "Methanol anhydrous",
      sku: "SOLV-MeOH-1L",
      description: "Anhydrous Methanol 99.8%, HPLC grade solvent.",
      category: "Solvents",
      baseUnit: Unit.mL,
      basePrice: 0.25, // 250 INR per L => 0.25 INR per mL
      stock: 15000.0, // 15 L
      isActive: true,
    },
    {
      name: "Pipette 10mL",
      sku: "EQP-PIP-10",
      description: "Graduated glass measuring pipette, 10mL capacity.",
      category: "Equipment",
      baseUnit: Unit.unit,
      basePrice: 320.0, // 320 INR per unit
      stock: 20.0,
      isActive: true,
    },
    {
      name: "Sulfuric Acid (H2SO4)",
      sku: "CHEM-H2SO4-1L",
      description: "Sulfuric Acid 98% laboratory grade chemical.",
      category: "Chemicals",
      baseUnit: Unit.mL,
      basePrice: 0.85, // 850 INR per L => 0.85 INR per mL
      stock: 20000.0, // 20 L
      isActive: true,
    },
    {
      name: "Magnetic Stirrer",
      sku: "EQP-MAG-STIR",
      description: "Laboratory magnetic stirrer with hot plate (up to 280C, 1500 rpm).",
      category: "Equipment",
      baseUnit: Unit.unit,
      basePrice: 8500.0, // 8500 INR per unit
      stock: 5.0,
      isActive: true,
    },
  ];

  for (const prod of productsData) {
    const product = await prisma.product.create({
      data: prod,
    });
    console.log(`Created product: ${product.name} (SKU: ${product.sku})`);
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
