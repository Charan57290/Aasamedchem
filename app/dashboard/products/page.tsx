"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { Search, Loader2, Tag, Layers, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR, getCompatibleUnits } from "@/lib/units";

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

export default function UserProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/products?search=${encodeURIComponent(
          search
        )}&category=${encodeURIComponent(categoryFilter)}`
      );
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(data);

      // Collect categories
      const allRes = await fetch("/api/products");
      if (allRes.ok) {
        const allData: Product[] = await allRes.json();
        const uniqueCats = Array.from(new Set(allData.map((p) => p.category)));
        setCategories(uniqueCats);
      }
    } catch (error: any) {
      toast.error(error.message || "Error loading products");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
          Chemical & Equipment Catalog
        </h1>
        <p className="text-slate-400 text-sm">
          Browse items, search spec sheets, check live stock, and prepare orders.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search catalog by name or SKU..."
              className="pl-9 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-teal-500 focus-visible:ring-offset-slate-950"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-slate-400 text-sm whitespace-nowrap">
              Category:
            </span>
            <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || "all")}>
              <SelectTrigger className="bg-slate-950/60 border-slate-800 text-slate-100 w-full md:w-[180px] focus:ring-teal-500">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {loading && products.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
          <p className="text-slate-400 text-sm">Searching chemical inventory...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-slate-500">
          No active products match your criteria at this moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const stockLevel = parseFloat(product.stock);
            const compatibleUnits = getCompatibleUnits(product.baseUnit);

            return (
              <Card
                key={product.id}
                className="bg-slate-900/30 border-slate-850 hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between group overflow-hidden relative"
              >
                {/* Visual Accent Glow */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500/20 to-emerald-500/20 group-hover:from-teal-500 group-hover:to-emerald-500 transition-all duration-500" />

                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <Badge className="bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border-none px-2 py-0">
                      {product.category}
                    </Badge>
                    <span className="text-[10px] font-mono text-slate-500 select-all">
                      {product.sku}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-200 group-hover:text-slate-100 transition-colors duration-150">
                    {product.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                  {/* Description */}
                  {product.description ? (
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 min-h-[32px]">
                      {product.description}
                    </p>
                  ) : (
                    <div className="min-h-[32px]" />
                  )}

                  {/* High Precision Price */}
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-850 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      <Tag className="h-3.5 w-3.5 text-slate-500" />
                      <span>Price</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-200 text-base">
                        {formatINR(product.basePrice)}
                      </span>
                      <span className="text-xs text-slate-500 block">
                        per {product.baseUnit}
                      </span>
                    </div>
                  </div>

                  {/* Stock Level & Units list */}
                  <div className="space-y-2 border-t border-slate-800/60 pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Available Inventory:</span>
                      {stockLevel > 0 ? (
                        <div className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>
                            {stockLevel.toLocaleString("en-IN")}{" "}
                            {product.baseUnit}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                          <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                          <span>Out of Stock</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Supported Units:</span>
                      <div className="flex gap-1">
                        {compatibleUnits.map((u) => (
                          <Badge
                            key={u}
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 border-slate-800 text-slate-400"
                          >
                            {u}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
