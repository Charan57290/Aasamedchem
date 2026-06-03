"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Beaker,
  ClipboardList,
  TrendingDown,
  ShoppingBag,
  PlusCircle,
  History,
  LogOut,
  Menu,
  X,
  User,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const role = session?.user?.role;
  const name = session?.user?.name || "User";
  const email = session?.user?.email || "";

  const adminLinks = [
    {
      name: "Manage Products",
      href: "/admin/products",
      icon: Beaker,
    },
    {
      name: "Manage Orders",
      href: "/admin/orders",
      icon: ClipboardList,
    },
    {
      name: "Stock Overview",
      href: "/admin/inventory",
      icon: TrendingDown,
    },
  ];

  const sellerLinks = [
    {
      name: "Browse Products",
      href: "/dashboard/products",
      icon: ShoppingBag,
    },
    {
      name: "Place Order",
      href: "/dashboard/order/new",
      icon: PlusCircle,
    },
    {
      name: "My Orders",
      href: "/dashboard/orders",
      icon: History,
    },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-800"
          onClick={toggleSidebar}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-45 w-72 flex flex-col bg-slate-900/90 backdrop-blur-md border-r border-slate-800 text-slate-100 transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent"
          >
            <Shield className="h-6 w-6 text-teal-400" />
            <span>Asa Medchem</span>
          </Link>
        </div>

        {/* Links Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-7">
          {/* Admin panel section */}
          {role === "ADMIN" && (
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Admin Panel
              </div>
              <ul className="space-y-1">
                {adminLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                            : "text-slate-300 hover:bg-slate-800 hover:text-slate-100 border border-transparent"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", isActive ? "text-teal-400" : "text-slate-400")} />
                        <span>{link.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* User Panel Section */}
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {role === "ADMIN" ? "User Panel Preview" : "User Panel"}
            </div>
            <ul className="space-y-1">
              {sellerLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "text-slate-300 hover:bg-slate-800 hover:text-slate-100 border border-transparent"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", isActive ? "text-emerald-400" : "text-slate-400")} />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Footer Profile & Sign Out */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 px-2 py-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-teal-400 border border-slate-700">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-200">
                {name}
              </p>
              <p className="text-xs truncate text-slate-400 mb-1">{email}</p>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  role === "ADMIN"
                    ? "text-teal-400 border-teal-500/30 bg-teal-500/5"
                    : "text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                )}
              >
                {role}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 gap-3 border border-transparent hover:border-rose-500/20"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
