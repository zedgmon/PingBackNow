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
} from "lucide-react";

const navigation = [
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

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-10 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-semibold">Business Auto-Responder</h1>
          </div>
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
                              ? "bg-gray-50 text-primary"
                              : "text-gray-700 hover:text-primary hover:bg-gray-50",
                            "w-full justify-start gap-x-3"
                          )}
                        >
                          <item.icon
                            className={cn(
                              location === item.href
                                ? "text-primary"
                                : "text-gray-400 group-hover:text-primary",
                              "h-5 w-5"
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <div className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900">
                  <span className="sr-only">Your business</span>
                  <span aria-hidden="true">{user?.businessName}</span>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <main className="py-10 lg:pl-72">
        <div className="px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}