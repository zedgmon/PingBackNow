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
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Initialize Stripe with better error handling
const isDevelopment = import.meta.env.MODE === 'development';
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

console.log('Stripe Config:', {
  isDevelopment,
  hasPublishableKey: !!stripePublishableKey,
  mode: import.meta.env.MODE,
  key: stripePublishableKey ? stripePublishableKey.substring(0, 8) + '...' : 'not set',
});

let stripePromise: Promise<any> | null = null;
const getStripe = async () => {
  if (!stripePromise) {
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
    stripePriceId: isDevelopment ? "price_mock_starter" : "price_1Nz2VKCDMMERRP2nLvNkfjX8",
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
    stripePriceId: isDevelopment ? "price_mock_growth" : "price_1Nz2VKCDMMERRP2nKvNkfjY9",
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
    stripePriceId: isDevelopment ? "price_mock_pro" : "price_1Nz2VKCDMMERRP2nMvNkfjZ0",
  },
];

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormData = z.infer<typeof emailSchema>;

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({ planId, email }: { planId: string; email: string }) => {
      try {
        console.log('Starting subscription process...', { isDevelopment, hasPublishableKey: !!stripePublishableKey });

        const stripe = await getStripe();
        if (!stripe) {
          if (isDevelopment) {
            console.log('Development mode: mocking subscription');
            const response = await apiRequest("POST", "/api/subscribe/create", {
              planId,
              email,
              paymentMethodId: 'mock_pm_123'
            });
            return response.json();
          }
          throw new Error('Stripe failed to initialize. Please check if the publishable key is set correctly.');
        }

        const response = await apiRequest("POST", "/api/subscribe/create", {
          planId,
          email,
          paymentMethodId: 'mock_pm_123'
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
      setShowEmailDialog(false);
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

  const handleSubscribe = (planId: string) => {
    setSelectedPlan(planId);
    setShowEmailDialog(true);
  };

  const onSubmitEmail = (data: EmailFormData) => {
    if (selectedPlan) {
      subscribeMutation.mutate({ planId: selectedPlan, email: data.email });
    }
  };

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
                  onClick={() => handleSubscribe(plan.stripePriceId)}
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

      {/* Email Collection Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Your Email</DialogTitle>
            <DialogDescription>
              Please provide your email address to continue with the subscription.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEmail)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="your@email.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={subscribeMutation.isPending}>
                {subscribeMutation.isPending ? "Processing..." : "Continue"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}