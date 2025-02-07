import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Starter",
    price: "$49",
    description: "Perfect for small businesses",
    features: [
      "500 SMS messages included",
      "Automatic missed call responses",
      "Basic lead tracking",
      "Email support",
    ],
    priceId: "starter",
  },
  {
    name: "Growth",
    price: "$99",
    description: "For growing businesses",
    features: [
      "1,500 SMS messages included",
      "Priority missed call handling",
      "Advanced lead management",
      "Priority support",
      "Custom auto-response messages",
    ],
    priceId: "growth",
  },
  {
    name: "Pro",
    price: "$199",
    description: "For high-volume businesses",
    features: [
      "5,000 SMS messages included",
      "Priority missed call handling",
      "Advanced lead management",
      "Priority support",
      "Custom auto-response messages",
      "Dedicated account manager",
    ],
    priceId: "pro",
  },
];

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const res = await apiRequest("POST", "/api/subscribe", { priceId });
      return res.json();
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="mt-2 text-muted-foreground">
            Choose a plan that works for your business
          </p>
        </div>

        {user?.subscriptionPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <CreditCard className="h-6 w-6" />
                <div>
                  <p className="font-medium">
                    {user.subscriptionPlan.charAt(0).toUpperCase() +
                      user.subscriptionPlan.slice(1)}{" "}
                    Plan
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Active subscription
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.name}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="mt-4 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => subscribeMutation.mutate(plan.priceId)}
                  disabled={
                    subscribeMutation.isPending ||
                    user?.subscriptionPlan === plan.priceId
                  }
                >
                  {subscribeMutation.isPending
                    ? "Processing..."
                    : user?.subscriptionPlan === plan.priceId
                    ? "Current Plan"
                    : "Subscribe"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Additional SMS Pricing</CardTitle>
            <CardDescription>
              Charges for messages beyond your plan's limit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              $0.05 <span className="text-sm text-muted-foreground">per SMS</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Additional SMS charges are billed at the end of each billing cycle
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
