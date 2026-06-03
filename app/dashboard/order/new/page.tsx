"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Search,
  ShoppingCart,
  Trash2,
  Loader2,
  Plus,
  Info,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR, getCompatibleUnits, getConversionFactor } from "@/lib/units";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string;
  baseUnit: string;
  basePrice: string;
  stock: string;
  isActive: boolean;
}

interface CartItem {
  product: Product;
  quantity: string;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch active products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();
        // Only active products
        setProducts(data.filter((p: Product) => p.isActive));
      } catch (err: any) {
        toast.error("Failed to load product catalog.");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Filter products for catalog search list
  const filteredCatalog = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  // Add item to cart
  const addToCart = (product: Product) => {
    // Check if already in cart
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      toast.error(`"${product.name}" is already in your cart.`);
      return;
    }

    const defaultUnit = product.baseUnit;
    const defaultQty = "1";
    const factor = getConversionFactor(product.baseUnit, defaultUnit);
    const unitPrice = parseFloat(product.basePrice) * factor;
    const lineTotal = 1 * unitPrice;

    setCart([
      ...cart,
      {
        product,
        quantity: defaultQty,
        unit: defaultUnit,
        unitPrice,
        lineTotal,
      },
    ]);
    toast.success(`Added "${product.name}" to cart.`);
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  // Update item in cart (quantity or unit change)
  const updateCartItem = (productId: string, quantity: string, unit: string) => {
    setCart(
      cart.map((item) => {
        if (item.product.id !== productId) return item;

        const parsed = parseFloat(quantity);
        const qtyNum = isNaN(parsed) || parsed < 0 ? 0 : parsed;

        // Recalculate conversions
        const factor = getConversionFactor(item.product.baseUnit, unit);
        const unitPrice = parseFloat(item.product.basePrice) * factor;
        const lineTotal = qtyNum * unitPrice;

        return {
          ...item,
          quantity,
          unit,
          unitPrice,
          lineTotal,
        };
      })
    );
  };

  // Calculate cart total
  const cartTotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);

  // Submit Order to backend
  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    // Check for 0 quantities
    const zeroQtyItem = cart.find((item) => {
      const qty = parseFloat(item.quantity);
      return isNaN(qty) || qty <= 0;
    });
    if (zeroQtyItem) {
      toast.error(`Please enter a valid quantity for "${zeroQtyItem.product.name}".`);
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading("Placing your order...");

    try {
      const orderItems = cart.map((item) => ({
        productId: item.product.id,
        orderedQty: parseFloat(item.quantity),
        orderedUnit: item.unit,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          notes,
        }),
      });

      const data = await res.json();
      toast.dismiss(loadingToast);

      if (!res.ok) {
        throw new Error(data.error || "Failed to place order.");
      }

      toast.success("Order placed successfully!");
      setCart([]);
      setNotes("");
      router.push("/dashboard/orders");
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
          New Purchase Order
        </h1>
        <p className="text-slate-400 text-sm">
          Select items from the catalog, specify quantities, and request fulfillment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Product Selector (Search & Add) */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Select Products
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Search active catalog and add to your order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Filter catalog..."
                  className="pl-9 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-teal-500 focus-visible:ring-offset-slate-950"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-6 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                  <span className="text-xs text-slate-400">Loading catalog...</span>
                </div>
              ) : filteredCatalog.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  No active products match search term.
                </p>
              ) : (
                <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredCatalog.map((product) => {
                    const availableStock = parseFloat(product.stock);
                    const isOutOfStock = availableStock <= 0;

                    return (
                      <div
                        key={product.id}
                        className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/30 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors duration-150"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-200 truncate">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                            <span>SKU: {product.sku}</span>
                            <span>•</span>
                            <span className={isOutOfStock ? "text-rose-400" : "text-emerald-400"}>
                              Stock: {availableStock} {product.baseUnit}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => addToCart(product)}
                          disabled={isOutOfStock}
                          className="h-7 w-7 rounded-md text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 border border-teal-500/20"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Order Cart Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm relative">
            <CardHeader className="border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-teal-400" />
                  <CardTitle className="text-base font-bold text-slate-200">
                    Order Items Cart
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                  {cart.length} {cart.length === 1 ? "item" : "items"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {cart.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm">
                  Your cart is empty. Add products from the catalog selector on the left.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-950/20 hover:bg-transparent">
                        <TableRow className="border-b border-slate-800 hover:bg-transparent">
                          <TableHead className="text-slate-400 text-xs">Product</TableHead>
                          <TableHead className="text-slate-400 text-xs w-28">
                            Select Unit
                          </TableHead>
                          <TableHead className="text-slate-400 text-xs w-28">
                            Quantity
                          </TableHead>
                          <TableHead className="text-slate-400 text-xs text-right w-36">
                            Live Price/Unit
                          </TableHead>
                          <TableHead className="text-slate-400 text-xs text-right w-36">
                            Line Total
                          </TableHead>
                          <TableHead className="text-slate-400 text-xs text-center w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item) => {
                          const compatible = getCompatibleUnits(item.product.baseUnit);

                          return (
                            <TableRow
                              key={item.product.id}
                              className="border-b border-slate-800/60 hover:bg-transparent"
                            >
                              {/* Product Info */}
                              <TableCell className="py-3.5">
                                <span className="font-semibold text-slate-200 text-sm block">
                                  {item.product.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  SKU: {item.product.sku}
                                </span>
                              </TableCell>

                              {/* Unit dropdown */}
                              <TableCell className="py-3.5">
                                <Select
                                  value={item.unit}
                                  onValueChange={(val) =>
                                    updateCartItem(item.product.id, item.quantity, val || item.product.baseUnit)
                                  }
                                >
                                  <SelectTrigger className="bg-slate-950/80 border-slate-800 text-slate-200 h-8 text-xs focus:ring-teal-500">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                    {compatible.map((unitOpt) => (
                                      <SelectItem
                                        key={unitOpt}
                                        value={unitOpt}
                                        className="text-xs"
                                      >
                                        {unitOpt}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>

                              {/* Quantity field */}
                              <TableCell className="py-3.5">
                                <Input
                                  type="text"
                                  className="h-8 bg-slate-950/80 border-slate-800 text-slate-200 focus-visible:ring-teal-500 focus-visible:ring-offset-slate-950 text-xs"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    // Regex: allows empty string, digits, and at most one decimal point
                                    if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                                      updateCartItem(
                                        item.product.id,
                                        val,
                                        item.unit
                                      );
                                    }
                                  }}
                                />
                              </TableCell>

                              {/* Unit Price */}
                              <TableCell className="py-3.5 text-right font-medium text-slate-300 text-xs">
                                <div>
                                  <p>{formatINR(item.unitPrice)}</p>
                                  <p className="text-[10px] text-slate-500">
                                    per {item.unit}
                                  </p>
                                </div>
                              </TableCell>

                              {/* Line Total */}
                              <TableCell className="py-3.5 text-right font-bold text-slate-200 text-sm">
                                {formatINR(item.lineTotal)}
                              </TableCell>

                              {/* Delete button */}
                              <TableCell className="py-3.5 text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFromCart(item.product.id)}
                                  className="h-7 w-7 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Summary & notes section */}
                  <div className="p-4 bg-slate-950/30 space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Order Notes / Special Delivery Instructions
                      </label>
                      <textarea
                        className="w-full h-20 rounded-md p-2.5 bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Specify chemical grade requirements, specific certifications, or packing instructions..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={submitting}
                      />
                    </div>

                    <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Price conversions info banner */}
                      <div className="flex items-start gap-1.5 max-w-sm text-[11px] text-slate-500 leading-normal">
                        <Info className="h-4 w-4 text-teal-500/60 shrink-0 mt-0.5" />
                        <span>
                          Prices are converted dynamically based on selection. High-precision rounding ensures error-free calculations.
                        </span>
                      </div>

                      {/* Total Amount & Submit */}
                      <div className="flex flex-col items-end gap-3 self-end sm:self-auto">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 font-semibold block uppercase">
                            Grand Total
                          </span>
                          <span className="text-2xl font-extrabold text-teal-400">
                            {formatINR(cartTotal)}
                          </span>
                        </div>
                        <Button
                          onClick={handleSubmitOrder}
                          disabled={submitting || cart.length === 0}
                          className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold px-6 shadow-lg shadow-teal-500/10"
                        >
                          {submitting ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Submitting Request...</span>
                            </div>
                          ) : (
                            "Submit Order"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
