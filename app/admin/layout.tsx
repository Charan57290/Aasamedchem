import React from "react";
import { Sidebar } from "@/components/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex-1 pt-6 pr-6 pb-6 pl-6 lg:pt-8 lg:pr-8 lg:pb-8 lg:pl-80 mt-14 lg:mt-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
}
