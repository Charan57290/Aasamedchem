import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { status } = body;

    if (status !== "CONFIRMED" && status !== "REJECTED") {
      return NextResponse.json(
        { error: "Invalid status value. Must be CONFIRMED or REJECTED." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.status !== "PENDING") {
        throw new Error("Order has already been finalized.");
      }

      // If rejected, restore stock
      if (status === "REJECTED") {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.storedQty,
              },
            },
          });
        }
      }

      // Update status
      return await tx.order.update({
        where: { id },
        data: { status },
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

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
