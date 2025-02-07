import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Users,
  CreditCard,
  MessageSquare,
  LifeBuoy,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  {
    title: "Dashboard",
    icon: BarChart,
    href: "/admin",
  },
  {
    title: "Customers",
    icon: Users,
    href: "/admin/customers",
  },
  {
    title: "Billing",
    icon: CreditCard,
    href: "/admin/billing",
  },
  {
    title: "Usage Metrics",
    icon: MessageSquare,
    href: "/admin/metrics",
  },
  {
    title: "Support & Logs",
    icon: LifeBuoy,
    href: "/admin/support",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="font-semibold">
            Admin Dashboard
          </Link>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="space-y-4 py-4">
            <div className="px-3 py-2">
              <div className="space-y-1">
                <nav className="grid gap-1 px-2">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={location === item.href ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-2",
                          location === item.href && "bg-secondary"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                      </Button>
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
          <div className="px-5 py-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
