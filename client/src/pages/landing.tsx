import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageCircle, Phone, CalendarDays, Users, Calculator, DollarSign, Percent, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";

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

      {/* ROI Calculator Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-6">
            Calculate Your Potential Revenue
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            See how much revenue you could recover by converting missed calls into leads. Based on our customer data, this calculator uses a 20% conversion rate - the average success rate businesses achieve with our auto-response system.
          </p>

          <div className="max-w-3xl mx-auto">
            <Card className="p-6">
              <CardContent className="space-y-8 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="missedCalls">Monthly Missed Calls</Label>
                    <div className="relative">
                      <Input
                        id="missedCalls"
                        type="number"
                        placeholder="e.g., 100"
                        className="pl-10"
                        onChange={(e) => {
                          const calls = parseInt(e.target.value) || 0;
                          const value = parseFloat(document.getElementById('customerValue')?.value || '0');
                          const margin = parseFloat(document.getElementById('profitMargin')?.value || '0');

                          const conversionRate = 0.20; // 20% default conversion rate
                          const recoveredCustomers = Math.round(calls * conversionRate);
                          const additionalRevenue = recoveredCustomers * value;
                          const additionalProfit = additionalRevenue * (margin / 100);

                          document.getElementById('recoveredCustomers').textContent = recoveredCustomers.toString();
                          document.getElementById('additionalRevenue').textContent = `$${additionalRevenue.toLocaleString()}`;
                          document.getElementById('additionalProfit').textContent = `$${Math.round(additionalProfit).toLocaleString()}`;
                        }}
                      />
                      <Calculator className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerValue">Average Customer Value ($)</Label>
                    <div className="relative">
                      <Input
                        id="customerValue"
                        type="number"
                        placeholder="e.g., 200"
                        className="pl-10"
                        onChange={(e) => {
                          const calls = parseInt(document.getElementById('missedCalls')?.value || '0');
                          const value = parseFloat(e.target.value) || 0;
                          const margin = parseFloat(document.getElementById('profitMargin')?.value || '0');

                          const conversionRate = 0.20;
                          const recoveredCustomers = Math.round(calls * conversionRate);
                          const additionalRevenue = recoveredCustomers * value;
                          const additionalProfit = additionalRevenue * (margin / 100);

                          document.getElementById('recoveredCustomers').textContent = recoveredCustomers.toString();
                          document.getElementById('additionalRevenue').textContent = `$${additionalRevenue.toLocaleString()}`;
                          document.getElementById('additionalProfit').textContent = `$${Math.round(additionalProfit).toLocaleString()}`;
                        }}
                      />
                      <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profitMargin">Profit Margin (%)</Label>
                    <div className="relative">
                      <Input
                        id="profitMargin"
                        type="number"
                        placeholder="e.g., 30"
                        className="pl-10"
                        onChange={(e) => {
                          const calls = parseInt(document.getElementById('missedCalls')?.value || '0');
                          const value = parseFloat(document.getElementById('customerValue')?.value || '0');
                          const margin = parseFloat(e.target.value) || 0;

                          const conversionRate = 0.20;
                          const recoveredCustomers = Math.round(calls * conversionRate);
                          const additionalRevenue = recoveredCustomers * value;
                          const additionalProfit = additionalRevenue * (margin / 100);

                          document.getElementById('recoveredCustomers').textContent = recoveredCustomers.toString();
                          document.getElementById('additionalRevenue').textContent = `$${additionalRevenue.toLocaleString()}`;
                          document.getElementById('additionalProfit').textContent = `$${Math.round(additionalProfit).toLocaleString()}`;
                        }}
                      />
                      <Percent className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Recovered Customers</CardTitle>
                      <CardDescription>Monthly potential</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold" id="recoveredCustomers">0</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Additional Revenue</CardTitle>
                      <CardDescription>Monthly potential</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold" id="additionalRevenue">$0</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Additional Profit</CardTitle>
                      <CardDescription>Monthly potential</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold" id="additionalProfit">$0</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Simple, Transparent Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$49",
                description: "Best For: Small businesses with low call volume that want to stay responsive to missed calls.",
                messages: "500",
                extraSMS: "$0.05",
                features: ["Auto-response system", "Basic dashboard", "Lead capture", "Email support"],
              },
              {
                name: "Growth",
                price: "$99",
                description: "Best For: Growing businesses that frequently miss calls and want to recover more customers.",
                messages: "1,500",
                extraSMS: "$0.04",
                popular: true,
                features: ["Advanced auto-responses", "Lead management", "Analytics dashboard", "Priority support"],
              },
              {
                name: "Pro",
                price: "$199",
                description: "Best For: High-volume businesses that miss a lot of calls and need automated follow-ups at scale.",
                messages: "5,000",
                extraSMS: "$0.03",
                features: ["Enterprise auto-responses", "Advanced automation", "Custom integrations", "Dedicated support"],
              },
            ].map((plan) => (
              <Card key={plan.name} className={`relative transition-all duration-200 hover:shadow-lg ${plan.popular ? 'border-primary shadow-md scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 text-center">
                    <span className="bg-primary text-primary-foreground text-sm px-4 py-1 rounded-full font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <div className="text-4xl font-bold">{plan.price}</div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-t border-b py-4">
                      <div className="font-medium">{plan.messages} SMS included</div>
                      <div className="text-sm text-muted-foreground">
                        {plan.extraSMS} per additional SMS
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-6">
                    <Link href="/register">
                      <Button 
                        className="w-full" 
                        variant={plan.popular ? "default" : "outline"}
                        size="lg"
                      >
                        Start Free Trial
                      </Button>
                    </Link>
                  </div>
                </CardContent>
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