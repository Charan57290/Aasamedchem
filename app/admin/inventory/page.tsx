"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { Loader2, AlertTriangle, Search, TrendingDown, Layers } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  baseUnit: string;
  stock: string;
  isActive: boolean;
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const LOW_STOCK_THRESHOLD = 15.0; // Warnings threshold for base unit quantities

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to load inventory data");
      const data = await res.json();
      setProducts(data);
    } catch (error: any) {
      toast.error(error.message || "Error fetching inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Calculations
  const totalProductsCount = products.length;
  const lowStockProducts = products.filter(
    (p) => parseFloat(p.stock) < LOW_STOCK_THRESHOLD
  );
  const lowStockCount = lowStockProducts.length;

  const filteredInventory = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase());

    const isLow = parseFloat(product.stock) < LOW_STOCK_THRESHOLD;
    const matchesLowStockFilter = !onlyLowStock || isLow;

    return matchesSearch && matchesLowStockFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
          Stock Overview
        </h1>
        <p className="text-slate-400 text-sm">
          Monitor real-time inventory counts in base units and review low stock alerts.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Total Catalog Items
            </CardTitle>
            <Layers className="h-5 w-5 text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-100">
              {totalProductsCount}
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Active and inactive items in current database
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Low Stock Warnings
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-500">
              {lowStockCount}
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Items with stock levels below {LOW_STOCK_THRESHOLD} base units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by product, SKU, or category..."
              className="pl-9 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-teal-500 focus-visible:ring-offset-slate-950"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-800 text-teal-500 bg-slate-950 accent-teal-500 focus:ring-teal-500"
                checked={onlyLowStock}
                onChange={(e) => setOnlyLowStock(e.target.checked)}
              />
              <span className="font-semibold text-slate-300">
                Show Low Stock Only
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            <p className="text-slate-400 text-sm">Loading stock ledger...</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No stock listings match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-950/40 border-b border-slate-800">
                <TableRow className="border-b border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-300 font-semibold">
                    Product Name
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold">
                    SKU Code
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold">
                    Category
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-right">
                    Current Stock (Base Unit)
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-center">
                    Alert Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((product) => {
                  const stockNum = parseFloat(product.stock);
                  const isLowStock = stockNum < LOW_STOCK_THRESHOLD;

                  return (
                    <TableRow
                      key={product.id}
                      className={`border-b border-slate-800/60 transition-colors duration-150 ${
                        isLowStock
                          ? "bg-amber-500/5 hover:bg-amber-500/10"
                          : "hover:bg-slate-800/20"
                      }`}
                    >
                      <TableCell className="font-semibold text-slate-200">
                        {product.name}
                        {!product.isActive && (
                          <Badge className="bg-slate-800 text-slate-500 ml-2 py-0 border-none">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-300">
                        {product.sku}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-slate-800 text-slate-300 border-none px-2 py-0.5"
                        >
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-200">
                        <span
                          className={`${
                            isLowStock ? "text-amber-400 font-extrabold" : "text-slate-200"
                          }`}
                        >
                          {stockNum.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 8,
                          })}
                        </span>{" "}
                        <span className="text-xs text-slate-500 font-normal">
                          {product.baseUnit}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {isLowStock ? (
                          <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Low Stock</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                            <TrendingDown className="h-3 w-3 rotate-180" />
                            <span>Healthy</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
