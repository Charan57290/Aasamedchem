export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCompatibleUnits, getConversionFactor } from "@/lib/units";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  const userId = session.user.id;

  try {
    const orders = await prisma.order.findMany({
      where: role === "ADMIN" ? {} : { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item." },
        { status: 400 }
      );
    }

    // Run transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create order template
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          status: "PENDING",
          totalAmount: 0.0,
          notes: notes || "",
        },
      });

      let totalAmount = new Prisma.Decimal(0.0);

      // 2. Process each item
      for (const item of items) {
        const { productId, orderedQty, orderedUnit } = item;

        if (!productId || !orderedQty || !orderedUnit) {
          throw new Error("Invalid item format in order.");
        }

        const qtyNum = parseFloat(orderedQty);
        if (isNaN(qtyNum) || qtyNum <= 0) {
          throw new Error("Quantity must be a positive number.");
        }

        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error(`Product not found.`);
        }

        if (!product.isActive) {
          throw new Error(`Product "${product.name}" is no longer active.`);
        }

        // Verify unit compatibility
        const compatibleUnits = getCompatibleUnits(product.baseUnit);
        if (!compatibleUnits.includes(orderedUnit)) {
          throw new Error(
            `Unit "${orderedUnit}" is incompatible with product "${product.name}" (base unit: ${product.baseUnit}).`
          );
        }

        // Perform Conversions
        const factor = getConversionFactor(product.baseUnit, orderedUnit);
        const orderedQtyDec = new Prisma.Decimal(qtyNum);
        const storedQtyDec = orderedQtyDec.mul(factor);
        const unitPriceDec = product.basePrice.mul(factor);
        const lineTotalDec = orderedQtyDec.mul(unitPriceDec);

        // Check Stock
        if (product.stock.lessThan(storedQtyDec)) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available stock: ${(product.stock as any).toNumber()} ${product.baseUnit}, requested: ${(storedQtyDec as any).toNumber()} ${product.baseUnit} equivalent.`
          );
        }

        // Deduct Stock
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: product.stock.sub(storedQtyDec),
          },
        });

        // Insert Order Item
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: product.id,
            orderedUnit,
            orderedQty: orderedQtyDec,
            storedQty: storedQtyDec,
            unitPrice: unitPriceDec,
            lineTotal: lineTotalDec,
          },
        });

        totalAmount = totalAmount.add(lineTotalDec);
      }

      // 3. Update total order amount
      return await tx.order.update({
        where: { id: newOrder.id },
        data: {
          totalAmount,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
