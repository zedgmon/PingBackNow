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
import { CreditUsageChart } from "@/components/credit-usage-chart";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe with better error handling
const isDevelopment = import.meta.env.MODE === 'development';
const stripePublishableKey = isDevelopment 
  ? (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_MOCK_KEY)
  : import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

console.log('Stripe Config:', {
  isDevelopment,
  hasPublishableKey: !!stripePublishableKey,
  mode: import.meta.env.MODE,
  key: stripePublishableKey ? stripePublishableKey.substring(0, 8) + '...' : 'not set',
  usingMockKey: stripePublishableKey === import.meta.env.VITE_STRIPE_MOCK_KEY
});

let stripePromise: Promise<any> | null = null;
const getStripe = async () => {
  if (!stripePromise) {
    if (isDevelopment) {
      console.log('Development mode: Using mock Stripe');
      return null;
    }

    if (!stripePublishableKey) {
      console.error('Stripe publishable key is missing');
      return null;
    }

    try {
      stripePromise = loadStripe(stripePublishableKey);
      const stripe = await stripePromise;
      console.log('Stripe initialized:', !!stripe);
      return stripe;
    } catch (error) {
      console.error('Stripe initialization error:', error);
      return null;
    }
  }
  return stripePromise;
};

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
    stripePriceId: "price_H5rlYOyNvVih2d", // Test price ID
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
    stripePriceId: "price_H5rlZPzNwXij3e", // Test price ID
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
    stripePriceId: "price_H5rlXQyMuWik4f", // Test price ID
  },
];

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      try {
        console.log('Starting subscription process...', { isDevelopment, hasPublishableKey: !!stripePublishableKey });

        const stripe = await getStripe();
        if (!stripe) {
          if (isDevelopment) {
            // In development, we can mock the subscription
            console.log('Development mode: mocking subscription');
            const response = await apiRequest("POST", "/api/subscribe/create", { 
              planId,
              paymentMethodId: 'mock_pm_123'
            });
            return response.json();
          }
          throw new Error('Stripe failed to initialize. Please check if the publishable key is set correctly.');
        }

        // Create subscription with real Stripe integration
        const response = await apiRequest("POST", "/api/subscribe/create", { 
          planId,
          paymentMethodId: 'mock_pm_123' // For testing, replace with real payment method in production
        });

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        return data;
      } catch (error) {
        console.error('Subscription error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Subscription created",
        description: isDevelopment 
          ? "Test subscription created successfully."
          : "Your subscription has been created successfully.",
      });
    },
    onError: (error: Error) => {
      console.error('Subscription error details:', error);
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

        <CreditUsageChart />

        {/* Display current subscription if exists */}
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

        {/* Card element container */}
        <div id="card-element" className="p-4 border rounded-md bg-background"></div>

        {/* Subscription plans */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                  onClick={() => subscribeMutation.mutate(plan.stripePriceId)}
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

        {/* Additional pricing information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional SMS Pricing</CardTitle>
            <CardDescription>
              Charges for messages beyond your plan's limit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Starter Plan</p>
                <p className="text-lg font-medium">
                  $0.05{" "}
                  <span className="text-sm text-muted-foreground">
                    per additional SMS
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Growth Plan</p>
                <p className="text-lg font-medium">
                  $0.04{" "}
                  <span className="text-sm text-muted-foreground">
                    per additional SMS
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Pro Plan</p>
                <p className="text-lg font-medium">
                  $0.03{" "}
                  <span className="text-sm text-muted-foreground">
                    per additional SMS
                  </span>
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Additional SMS charges are billed at the end of each billing
                cycle
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}