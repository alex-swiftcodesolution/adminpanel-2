"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Lock, Settings, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/locks", label: "Locks", icon: Lock },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const navVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1 },
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            <Lock className="h-6 w-6 text-primary" />
            <span>LockAdmin</span>
          </Link>
        </div>

        <div className="flex-1 overflow-auto py-4">
          <motion.nav
            variants={navVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-1 px-4 text-sm font-medium"
          >
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <motion.div key={item.href} variants={itemVariants}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-primary",
                      isActive && "bg-muted text-primary font-medium"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </motion.nav>
        </div>

        <div className="border-t p-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">Need Help?</CardTitle>
              <CardDescription className="text-xs">
                We&apos;re here 24/7
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button size="sm" variant="outline" className="w-full">
                <LifeBuoy className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </aside>
  );
}
