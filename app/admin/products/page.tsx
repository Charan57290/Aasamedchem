"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/units";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string;
  baseUnit: "g" | "kg" | "mL" | "L" | "unit";
  basePrice: string;
  stock: string;
  isActive: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected product states
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    description: "",
    baseUnit: "g" as any,
    basePrice: "",
    stock: "",
    isActive: true,
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/products?search=${encodeURIComponent(
          search
        )}&category=${encodeURIComponent(categoryFilter)}`
      );
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);

      // Collect unique categories
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

  // Open Edit Dialog
  const handleEditClick = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      description: product.description || "",
      baseUnit: product.baseUnit,
      basePrice: parseFloat(product.basePrice).toString(),
      stock: parseFloat(product.stock).toString(),
      isActive: product.isActive,
    });
    setIsEditOpen(true);
  };

  // Open Delete Dialog
  const handleDeleteClick = (product: Product) => {
    setCurrentProduct(product);
    setIsDeleteOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category: "",
      description: "",
      baseUnit: "g",
      basePrice: "",
      stock: "",
      isActive: true,
    });
    setCurrentProduct(null);
  };

  // Handle Add Product Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, sku, category, baseUnit, basePrice, stock } = formData;

    if (!name || !sku || !category || !baseUnit || !basePrice || !stock) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          basePrice: parseFloat(basePrice),
          stock: parseFloat(stock),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");

      toast.success("Product created successfully!");
      setIsAddOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Error creating product");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Product Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    const { name, sku, category, baseUnit, basePrice, stock } = formData;

    if (!name || !sku || !category || !baseUnit || !basePrice || !stock) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${currentProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          basePrice: parseFloat(basePrice),
          stock: parseFloat(stock),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");

      toast.success("Product updated successfully!");
      setIsEditOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Error updating product");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Product Confirm
  const handleDeleteConfirm = async () => {
    if (!currentProduct) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${currentProduct.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");

      toast.success("Product deleted successfully!");
      setIsDeleteOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Error deleting product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Product Database
          </h1>
          <p className="text-slate-400 text-sm">
            Add, update, or manage products, inventories, and categories.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
          className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold gap-1.5 self-start sm:self-auto shadow-lg shadow-teal-500/10"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Product</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by name or SKU..."
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

      {/* Products Table */}
      <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            <p className="text-slate-400 text-sm">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No products found matching your criteria. Try adding a new one!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-950/40 border-b border-slate-800">
                <TableRow className="border-b border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-300 font-semibold">
                    Product Info
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold">
                    SKU
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold">
                    Category
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold">
                    Base Unit
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-right">
                    Price/Base Unit
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-right">
                    Stock Level
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-center w-28">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow
                    key={product.id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors duration-150"
                  >
                    <TableCell className="font-medium text-slate-200">
                      <div>
                        <p className="font-semibold text-slate-100">
                          {product.name}
                        </p>
                        {product.description && (
                          <p className="text-slate-400 text-xs truncate max-w-xs mt-0.5">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-300">
                      {product.sku}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="bg-slate-800/80 text-slate-300 border-none px-2 py-0.5"
                      >
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-300">
                      {product.baseUnit}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-200">
                      {formatINR(product.basePrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-200">
                      {parseFloat(product.stock).toLocaleString("en-IN")}{" "}
                      <span className="text-xs text-slate-500 font-normal">
                        {product.baseUnit}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {product.isActive ? (
                        <div className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Active</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-slate-500 text-xs font-semibold">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Inactive</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(product)}
                          className="h-8 w-8 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(product)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* ADD DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-100">
              Add New Product
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Create a new catalog item. Enter values in base units only.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Name *
                </label>
                <Input
                  className="bg-slate-950 border-slate-800 focus:ring-teal-500"
                  required
                  placeholder="e.g. Sodium Chloride"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  SKU Code *
                </label>
                <Input
                  className="bg-slate-950 border-slate-800 focus:ring-teal-500"
                  required
                  placeholder="e.g. CHEM-NaCl-1KG"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Category *
                </label>
                <Input
                  className="bg-slate-950 border-slate-800 focus:ring-teal-500"
                  required
                  placeholder="e.g. Chemicals"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Base Storage Unit *
                </label>
                <Select
                  value={formData.baseUnit}
                  onValueChange={(val) =>
                    setFormData({ ...formData, baseUnit: (val || "g") as any })
                  }
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="g">Grams (g)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="mL">Milliliters (mL)</SelectItem>
                    <SelectItem value="L">Liters (L)</SelectItem>
                    <SelectItem value="unit">Count (unit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Price per Base Unit (INR) *
                </label>
                <Input
                  type="number"
                  step="0.00000001"
                  className="bg-slate-950 border-slate-800 focus:ring-teal-500"
                  required
                  placeholder="e.g. 0.15"
                  value={formData.basePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, basePrice: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Initial Stock Qty (Base Unit) *
                </label>
                <Input
                  type="number"
                  step="0.00000001"
                  className="bg-slate-950 border-slate-800 focus:ring-teal-500"
                  required
                  placeholder="e.g. 50000"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Description
              </label>
              <textarea
                className="w-full h-20 rounded-md p-2 bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Product descriptions, grade details..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <DialogFooter className="pt-4 border-t border-slate-800/60 mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Product"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-100">
              Edit Product
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Update catalog details and inventory stock levels.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Name *
                </label>
                <Input
                  className="bg-slate-950 border-slate-800 focus:ring-teal-500"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  SKU Code *
                </label>
                <Input
                  className="bg-slate-950 border-slate-800 focus:ring-teal-500"
                  required
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Category *
                </label>
                <Input
                  className="bg-slate-950 border-slate-800 focus:ring-teal-500"
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Base Storage Unit *
                </label>
                <Select
                  value={formData.baseUnit}
                  onValueChange={(val) =>
                    setFormData({ ...formData, baseUnit: (val || "g") as any })
                  }
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="g">Grams (g)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="mL">Milliliters (mL)</SelectItem>
                    <SelectItem value="L">Liters (L)</SelectItem>
                    <SelectItem value="unit">Count (unit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Price per Base Unit (INR) *
                </label>
                <Input
                  type="number"
                  step="0.00000001"
                  className="bg-slate-950 border-slate-800 focus:ring-teal-500"
                  required
                  value={formData.basePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, basePrice: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Current Stock Qty (Base Unit) *
                </label>
                <Input
                  type="number"
                  step="0.00000001"
                  className="bg-slate-950 border-slate-800 focus:ring-teal-500"
                  required
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Description
              </label>
              <textarea
                className="w-full h-20 rounded-md p-2 bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 rounded border-slate-800 text-teal-500 bg-slate-950 accent-teal-500 focus:ring-teal-500"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
              />
              <label htmlFor="isActive" className="text-xs font-semibold text-slate-300 cursor-pointer">
                Product is active and visible to Sellers
              </label>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-800/60 mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-500">
              Confirm Delete Product
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-sm text-slate-300">
              Are you sure you want to delete product{" "}
              <strong className="text-slate-100">
                &quot;{currentProduct?.name}&quot;
              </strong>{" "}
              (SKU: {currentProduct?.sku})?
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              This action cannot be undone. Products referenced by historical order
              records cannot be deleted directly; they must be set to inactive to
              preserve data integrity.
            </p>
          </div>
          <DialogFooter className="pt-4 border-t border-slate-800/60">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={submitting}
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
