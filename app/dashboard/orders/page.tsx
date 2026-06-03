"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { Loader2, Eye, History, FileText } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/units";

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
  items: OrderItem[];
}

export default function SellerOrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchMyOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to load orders");
      const data: Order[] = await res.json();
      setOrders(data);
    } catch (error: any) {
      toast.error(error.message || "Error loading order history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  // Filter client-side
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      (order.notes && order.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
          Purchase History
        </h1>
        <p className="text-slate-400 text-sm">
          Track and review the fulfillment status of your submitted orders.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <History className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by Order ID or notes..."
              className="pl-9 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-teal-500 focus-visible:ring-offset-slate-950"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-slate-400 text-sm whitespace-nowrap">
              Fulfillment Status:
            </span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            <p className="text-slate-400 text-sm">Loading purchase logs...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No order records found. Start by placing a new order request!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-950/40 border-b border-slate-800">
                <TableRow className="border-b border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-300 font-semibold w-40">
                    Order ID
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold">
                    Date Placed
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-center">
                    Fulfillment Status
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-right">
                    Total Amount (INR)
                  </TableHead>
                  <TableHead className="text-slate-300 font-semibold text-center w-28">
                    Items Detail
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors duration-150"
                  >
                    <TableCell className="font-mono text-xs text-slate-200">
                      {order.id}
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {new Date(order.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
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
                    <TableCell className="text-right font-extrabold text-slate-200">
                      {formatINR(order.totalAmount)}
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

      {/* DETAILED VIEW DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-100">
              Fulfillment Statement
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Statement ID: {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-2">
              {/* Order Meta Panel */}
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-850 text-sm flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-semibold">
                    Date Submitted
                  </span>
                  <span className="text-slate-200">
                    {new Date(selectedOrder.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block uppercase font-semibold mb-1">
                    Fulfillment Status
                  </span>
                  <Badge
                    className={cn(
                      "text-xs px-2 py-0.5 font-semibold rounded-full",
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

              {/* Items Table */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Requested Items
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
                          Total Order Price:
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
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase font-semibold">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <span>Submitted Notes</span>
                  </div>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed mt-1">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
