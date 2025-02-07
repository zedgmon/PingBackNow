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
  Home,
} from "lucide-react";
import { NotificationBell } from "@/components/ui/notifications";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
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
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </li>
      </ul>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Always visible */}
      <div className="w-64 flex-shrink-0 border-r bg-card">
        <div className="flex h-16 shrink-0 items-center px-6 justify-between">
          <div className="flex items-center gap-4">
            <img src="/images/logo.png" alt="PingBack Now" className="h-8 w-auto" />
          </div>
          <NotificationBell />
        </div>
        <div className="flex flex-col gap-y-5 px-6 pb-4">
          <NavContent />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <div className="px-8 py-10">{children}</div>
      </div>
    </div>
  );
}