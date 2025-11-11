"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen w-full bg-muted/40 font-inter"
      role="application"
      aria-label="Dashboard layout"
    >
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <motion.main
          className="flex-1 p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
