import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageCircle, Phone, CalendarDays, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-semibold text-xl">Business Auto-Responder</div>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Never Miss a Business Opportunity
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Automate your business communications and convert missed calls into leads
            with our intelligent response system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Grow Your Business
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Auto-Response",
                description: "Never miss a call with instant SMS responses",
                icon: MessageCircle,
              },
              {
                title: "Lead Tracking",
                description: "Convert missed calls into valuable leads",
                icon: Users,
              },
              {
                title: "Scheduled Messages",
                description: "Plan and automate follow-up messages",
                icon: CalendarDays,
              },
              {
                title: "Call Management",
                description: "Track and manage all business calls efficiently",
                icon: Phone,
              },
            ].map((feature) => (
              <Card key={feature.title} className="border-none">
                <CardHeader>
                  <feature.icon className="w-12 h-12 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Simple, Transparent Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$29",
                description: "Perfect for small businesses",
                features: [
                  "100 SMS messages/month",
                  "Basic auto-response",
                  "Lead tracking",
                  "Email support",
                ],
              },
              {
                name: "Professional",
                price: "$79",
                description: "For growing businesses",
                features: [
                  "500 SMS messages/month",
                  "Custom auto-responses",
                  "Advanced lead management",
                  "Priority support",
                ],
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "For large organizations",
                features: [
                  "Unlimited SMS messages",
                  "Multiple phone numbers",
                  "API access",
                  "24/7 support",
                ],
              },
            ].map((plan) => (
              <Card key={plan.name} className="relative">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold mt-4">
                    {plan.price}
                    {plan.price !== "Custom" && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /month
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <span className="mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button className="w-full" variant={plan.name === "Professional" ? "default" : "outline"}>
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
                {plan.name === "Professional" && (
                  <div className="absolute -top-2 left-0 right-0 text-center">
                    <span className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Transform Your Business Communication?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of businesses using our platform to grow their customer base
            and increase revenue.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Business Auto-Responder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}