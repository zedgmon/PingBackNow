import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  Phone,
  CalendarDays,
  Users,
  Settings,
  CreditCard,
  LogOut,
  MessageCircle,
  Menu,
  X,
  Home,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Missed Calls", href: "/missed-calls", icon: Phone },
  { name: "Conversations", href: "/conversations", icon: MessageCircle },
  { name: "Scheduled Messages", href: "/scheduled", icon: CalendarDays },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Billing", href: "/billing", icon: CreditCard },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <nav className="flex flex-1 flex-col">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" className="-mx-2 space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      location === item.href
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                      "w-full justify-start gap-x-3"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    {item.name}
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </li>
        <li className="mt-auto border-t pt-4">
          <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold">
            <span className="sr-only">Your business</span>
            <span aria-hidden="true">{user?.businessName}</span>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start px-2"
            onClick={() => {
              logoutMutation.mutate();
              setOpen(false);
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </li>
      </ul>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="lg:hidden fixed top-4 left-4 z-50"
            size="icon"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-6">
          <div className="mb-8">
            <h1 className="text-xl font-semibold">Business Auto-Responder</h1>
          </div>
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-10 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-card px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-semibold">Business Auto-Responder</h1>
          </div>
          <NavContent />
        </div>
      </div>

      <main className="lg:pl-72">
        <div className="px-4 py-10 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}