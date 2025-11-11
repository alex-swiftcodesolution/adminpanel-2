import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MobileNav, AppBreadcrumbs, UserNav } from "./header-components";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4 sm:px-6">
      <MobileNav />
      <AppBreadcrumbs />
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search locks..."
          className="w-full rounded-lg bg-muted/50 pl-9 pr-4 md:w-64 lg:w-80"
        />
      </div>
      <UserNav />
    </header>
  );
}
