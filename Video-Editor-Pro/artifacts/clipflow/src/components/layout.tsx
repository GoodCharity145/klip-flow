import { Link, useLocation } from "wouter";
import { Home, Settings, LayoutGrid, CreditCard, LogOut, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk, useUser, Show } from "@clerk/react";
import { PaymentFailureBanner } from "@/components/payment-failure-banner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: React.ReactNode;
}

function UserMenu() {
  const { signOut } = useClerk();
  const { user } = useUser();

  if (!user) return null;

  const initials = (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "");
  const displayName = user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Account";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-accent transition-colors text-left">
          {user.imageUrl ? (
            <img src={user.imageUrl} alt={displayName} className="h-8 w-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
              {initials || "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.primaryEmailAddress?.emailAddress}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-48">
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={() => signOut({ redirectUrl: "/" })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/projects", label: "Projects", icon: LayoutGrid },
    { href: "/pricing", label: "Pricing", icon: CreditCard },
    { href: "/account", label: "Billing", icon: User },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex w-full bg-background dark text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <span className="text-primary font-black text-xs leading-none tracking-tight">KF</span>
          </div>
          <span className="font-bold text-lg tracking-tight">KlipFlow</span>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section at bottom of sidebar */}
        <div className="p-4 border-t border-border">
          <Show when="signed-in">
            <UserMenu />
          </Show>
          <Show when="signed-out">
            <div className="flex flex-col gap-2">
              <Link href="/sign-in">
                <Button variant="outline" size="sm" className="w-full">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="w-full">Get Started</Button>
              </Link>
            </div>
          </Show>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <PaymentFailureBanner />
        {children}
      </main>
    </div>
  );
}
