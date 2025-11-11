"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

// Animation variants for staggering form elements
const formContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const formItemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulate an API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In a real app, you'd handle authentication here.
    // For now, we'll just navigate to the dashboard.
    // You could add mock error handling like:
    // const formData = new FormData(e.currentTarget);
    // if (formData.get('password') === 'fail') {
    //   setError("Invalid email or password.");
    //   setIsLoading(false);
    //   return;
    // }

    router.push("/dashboard");
    // In a real app, you wouldn't set isLoading to false on success
    // because the page will be unmounted.
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      {/* Left side - Branding and Visuals */}
      <div className="hidden bg-muted lg:flex lg:items-center lg:justify-center">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, delay: 0.2 }}
          >
            <Lock size={80} className="mx-auto text-primary" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-4xl font-bold tracking-tight"
          >
            Smart Lock Admin Panel
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-2 text-lg text-muted-foreground"
          >
            Centralized Management for Your Smart Locks
          </motion.p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex items-center justify-center py-12 min-h-screen">
        <motion.div
          className="mx-auto grid w-[350px] gap-6"
          variants={formContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="grid gap-2 text-center"
            variants={formItemVariants}
          >
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your credentials to access the dashboard
            </p>
          </motion.div>

          <form onSubmit={handleLogin} className="grid gap-4">
            <motion.div className="grid gap-2" variants={formItemVariants}>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                disabled={isLoading}
              />
            </motion.div>

            <motion.div
              className="grid gap-2 relative"
              variants={formItemVariants}
            >
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 bottom-1 h-7 w-7"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle password visibility</span>
              </Button>
            </motion.div>

            {/* Error Message Display */}
            {error && (
              <motion.div
                className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </motion.div>
            )}

            <motion.div variants={formItemVariants}>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
