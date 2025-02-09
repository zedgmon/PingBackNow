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
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreditUsageChart } from "@/components/credit-usage-chart";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
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

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Initialize Stripe with better error handling and logging
  const [stripeInitialized, setStripeInitialized] = useState(false);
  const isDevelopment = import.meta.env.MODE === 'development';
  const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  useEffect(() => {
    console.log('Environment Configuration:', {
      isDevelopment,
      hasStripeKey: !!stripePublishableKey,
      mode: import.meta.env.MODE,
      stripeKey: stripePublishableKey ? `${stripePublishableKey.substring(0, 8)}...` : 'not set',
      isAuthenticated: !!user,
    });

    const initStripe = async () => {
      if (!stripePublishableKey) {
        console.error('Stripe publishable key is missing');
        return;
      }

      try {
        const stripe = await loadStripe(stripePublishableKey);
        setStripeInitialized(!!stripe);
        console.log('Stripe initialized:', !!stripe);
      } catch (error) {
        console.error('Stripe initialization error:', error);
      }
    };

    initStripe();
  }, [stripePublishableKey, user]);

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({ planId, email }: { planId: string; email: string }) => {
      try {
        console.log('Starting subscription process...', { isDevelopment, hasPublishableKey: !!stripePublishableKey });

        if (!user) {
          throw new Error('Please log in to subscribe to a plan.');
        }

        if (isDevelopment) {
          console.log('Development mode: mocking subscription');
          const response = await apiRequest("POST", "/api/subscribe/create", {
            planId,
            email,
            paymentMethodId: 'mock_pm_123'
          });
          return response.json();
        }

        if (!stripeInitialized) {
          throw new Error('Payment system is not ready. Please try again in a few moments.');
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
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }
    setSelectedPlan(planId);
    setShowEmailDialog(true);
  };

  const onSubmitEmail = (data: EmailFormData) => {
    if (selectedPlan) {
      subscribeMutation.mutate({ planId: selectedPlan, email: data.email });
    }
  };

  const handleCancelSubscription = () => {
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = () => {
    setShowCancelDialog(false);
    // Create mailto link with pre-filled subject
    const email = 'pingback.billing@gmail.com';
    const subject = 'Subscription Cancellation Request';
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    toast({
      title: "Cancellation Instructions",
      description: (
        <div className="space-y-2">
          <p>To cancel your subscription, please email us at{' '}
            <a 
              href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}
              className="text-primary hover:underline"
            >
              {email}
            </a>
          </p>
          <p>Include your registered email address in the email.</p>
          <p>Our team will process your request within 24-48 hours.</p>
          <p>You will retain access to your subscription until the end of your current billing cycle.</p>
        </div>
      ),
      duration: 10000, // Show for 10 seconds
    });
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

        {/* Add cancellation section at the bottom */}
        {user?.subscriptionPlan && (
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Cancel Subscription</CardTitle>
              <CardDescription>
                Need to cancel your subscription? We're here to help.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                If you decide to cancel, you'll continue to have access to all features until the end of your current billing period.
              </p>
              <Button
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleCancelSubscription}
              >
                Cancel Subscription
              </Button>
            </CardContent>
          </Card>
        )}
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

      {/* Cancel Subscription Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>To cancel your subscription, please email us at{' '}
                <a 
                  href={`mailto:pingback.billing@gmail.com?subject=${encodeURIComponent('Subscription Cancellation Request')}`}
                  className="text-primary hover:underline"
                >
                  pingback.billing@gmail.com
                </a>
              </p>
              <p>Include your registered email address in the email.</p>
              <p>Our team will process your request within 24-48 hours.</p>
              <p>You will retain access to your subscription until the end of your current billing cycle.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelDialog(false)}>Close</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm}>
              Open Email Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}

// Plan definitions and email schema
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormData = z.infer<typeof emailSchema>;

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
    stripePriceId: "price_1QqVclCDMMERRP2ncvcdIx9k",
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
    stripePriceId: "price_1QqVd9CDMMERRP2nDrjsiOrj",
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
    stripePriceId: "price_1QqVdNCDMMERRP2nmIrc2RxU",
  },
];