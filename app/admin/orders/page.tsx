"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { Loader2, Eye, Check, X, ClipboardList } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/units";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  productId: string;
  orderedUnit: string;
  orderedQty: string;
  storedQty: string;
  unitPrice: string;
  lineTotal: string;
  product: {
    name: string;
    sku: string;
    baseUnit: string;
  };
}

interface Order {
  id: string;
  userId: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  totalAmount: string;
  notes: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch all orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to load orders");
      const data: Order[] = await res.json();
      setOrders(data);
    } catch (error: any) {
      toast.error(error.message || "Error fetching orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle Action (Confirm / Reject)
  const handleStatusChange = async (orderId: string, newStatus: "CONFIRMED" | "REJECTED") => {
    setSubmitting(true);
    const loadingToast = toast.loading(`Updating order status to ${newStatus}...`);

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update order status");

      toast.success(`Order ${newStatus.toLowerCase()} successfully!`);
      setIsDetailOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || "Error updating order");
    } finally {
      toast.dismiss(loadingToast);
      setSubmitting(false);
    }
  };

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  // Filter orders client-side for dynamic responsive rendering
  const filteredOrders = orders.filter((order) => {
    const userMatch =
      order.user.name.toLowerCase().includes(search.toLowerCase()) ||
      order.user.email.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === "all" || order.status === statusFilter;
    return userMatch && statusMatch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
          Order Management
        </h1>
        <p className="text-slate-400 text-sm">
          Review, approve, or reject customer and seller orders.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by Order ID, buyer name, or email..."
              className="pl-9 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-teal-500 focus-visible:ring-offset-slate-950"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-slate-400 text-sm whitespace-nowrap">
              Status:
            </span>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
              <SelectTrigger className="bg-slate-950/60 border-slate-800 text-slate-100 w-full md:w-[150px] focus:ring-teal-500">
                <SelectValue placeholder="All Orders" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            <p className="text-slate-400 text-sm">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No orders found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-950/40 border-b border-slate-800">
                <TableRow className="border-b border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-300 font-semibold w-32">
                    Order ID
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold">
                    User / Buyer
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-right">
                    Total Amount
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold">
                    Date Placed
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-center w-24">
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors duration-150"
                  >
                    <TableCell className="font-mono text-xs text-slate-300">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-100">
                          {order.user.name}
                        </p>
                        <p className="text-slate-500 text-xs">{order.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-2 py-0.5 text-xs font-semibold rounded-full",
                          order.status === "PENDING"
                            ? "text-blue-400 border-blue-500/30 bg-blue-500/5"
                            : order.status === "CONFIRMED"
                            ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                            : "text-rose-400 border-rose-500/30 bg-rose-500/5"
                        )}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-200">
                      {formatINR(order.totalAmount)}
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {new Date(order.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDetails(order)}
                        className="h-8 w-8 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* ORDER DETAILS DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-100">
              Order Details
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              ID: {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-2">
              {/* Buyer & Date Header Card */}
              <div className="grid grid-cols-2 gap-4 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-semibold">
                    Customer / User
                  </span>
                  <span className="font-semibold text-slate-200">
                    {selectedOrder.user.name}
                  </span>
                  <span className="text-xs text-slate-400 block">
                    {selectedOrder.user.email}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-semibold">
                    Order Date
                  </span>
                  <span className="text-slate-200">
                    {new Date(selectedOrder.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Status:</span>
                    <Badge
                      className={cn(
                        "text-[10px] px-1.5 py-0 font-semibold rounded-full",
                        selectedOrder.status === "PENDING"
                          ? "text-blue-400 border-blue-500/20 bg-blue-500/5"
                          : selectedOrder.status === "CONFIRMED"
                          ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                          : "text-rose-400 border-rose-500/20 bg-rose-500/5"
                      )}
                    >
                      {selectedOrder.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Order Items Breakdown
                </span>
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
                  <Table>
                    <TableHeader className="bg-slate-950/80 border-b border-slate-800">
                      <TableRow className="border-b border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-400 text-xs">Item</TableHead>
                        <TableHead className="text-slate-400 text-xs text-right">
                          Ordered Qty
                        </TableHead>
                        <TableHead className="text-slate-400 text-xs text-right">
                          Stored Qty (Base)
                        </TableHead>
                        <TableHead className="text-slate-400 text-xs text-right">
                          Unit Price
                        </TableHead>
                        <TableHead className="text-slate-400 text-xs text-right">
                          Line Total
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow
                          key={item.id}
                          className="border-b border-slate-800/60 hover:bg-slate-800/10"
                        >
                          <TableCell className="font-semibold text-slate-200">
                            <div>
                              <span>{item.product.name}</span>
                              <span className="block text-[10px] text-slate-500 font-mono">
                                SKU: {item.product.sku}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-slate-300 text-sm font-semibold">
                            {parseFloat(item.orderedQty)} {item.orderedUnit}
                          </TableCell>
                          <TableCell className="text-right text-slate-400 text-xs">
                            {parseFloat(item.storedQty)} {item.product.baseUnit}
                          </TableCell>
                          <TableCell className="text-right text-slate-300 text-sm">
                            {formatINR(item.unitPrice)}
                            <span className="text-[10px] text-slate-500 block">
                              per {item.orderedUnit}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-200">
                            {formatINR(item.lineTotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-slate-950/80 hover:bg-transparent">
                        <TableCell colSpan={4} className="text-right font-semibold text-slate-400 text-sm py-3">
                          Total Amount:
                        </TableCell>
                        <TableCell className="text-right font-extrabold text-teal-400 text-base py-3">
                          {formatINR(selectedOrder.totalAmount)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Order Notes */}
              {selectedOrder.notes && (
                <div className="space-y-1 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-xs text-slate-500 block uppercase font-semibold">
                    User Notes / Instructions
                  </span>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              {/* Admin Actions */}
              {selectedOrder.status === "PENDING" && (
                <DialogFooter className="pt-4 border-t border-slate-800/60 flex sm:justify-between items-center gap-4">
                  <span className="text-[11px] text-slate-500 leading-normal max-w-sm">
                    Confirming will finalize the transaction. Rejecting will revert stock counts.
                  </span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleStatusChange(selectedOrder.id, "REJECTED")
                      }
                      disabled={submitting}
                      className="border-rose-500/30 hover:border-rose-500 bg-rose-500/5 hover:bg-rose-500 text-rose-400 hover:text-white flex-1 sm:flex-none gap-1.5"
                    >
                      <X className="h-4 w-4" />
                      <span>Reject Order</span>
                    </Button>
                    <Button
                      onClick={() =>
                        handleStatusChange(selectedOrder.id, "CONFIRMED")
                      }
                      disabled={submitting}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold flex-1 sm:flex-none gap-1.5"
                    >
                      <Check className="h-4 w-4" />
                      <span>Confirm Order</span>
                    </Button>
                  </div>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
