import { Link } from "wouter";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageCircle, Phone, CalendarDays, Users, Calculator, DollarSign, Percent, Check, PhoneOff, ArrowUpRight, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo className="text-2xl font-bold" />
          </div>
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
                description: "A great starting point for businesses exploring automated follow-ups.",
                messages: "500",
                extraSMS: "$0.05",
                features: [
                  "Low call volume",
                  "Businesses that want basic auto-replies for missed calls",
                  "Those testing out SMS follow-ups before scaling"
                ],
              },
              {
                name: "Growth",
                price: "$99",
                description: "The best balance of affordability and lead recovery for growing businesses.",
                messages: "1,500",
                extraSMS: "$0.04",
                popular: true,
                features: [
                  "Frequently miss calls",
                  "Companies looking to recover more leads via SMS",
                  "Businesses that want a cost-effective balance of volume & price"
                ],
              },
              {
                name: "Pro",
                price: "$199",
                description: "A high-volume solution to maximize engagement and never miss a lead.",
                messages: "5,000",
                extraSMS: "$0.03",
                features: [
                  "That miss a lot of calls",
                  "Companies with multiple locations or high customer inquiries",
                  "Businesses that want a seamless, automated follow-up system to maximize customer engagement"
                ],
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
                        ${plan.name === "Starter" ? "0.05" : plan.name === "Growth" ? "0.04" : "0.03"} per additional SMS
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

      {/* Impact Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Missed Calls = Missed Revenue. Here's the Impact on Your Business.
          </h2>
          <p className="text-lg text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Most businesses don't realize how much revenue they lose to unanswered calls. With automated SMS follow-ups, you turn missed calls into paying customers—effortlessly.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <PhoneOff className="w-12 h-12 mx-auto text-primary mb-4" />
                <CardTitle className="text-2xl">42%</CardTitle>
                <CardDescription className="text-base">
                  of missed calls never get a callback — Customers go to competitors
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <ArrowUpRight className="w-12 h-12 mx-auto text-primary mb-4" />
                <CardTitle className="text-2xl">20%+</CardTitle>
                <CardDescription className="text-base">
                  conversion rate — A simple text after a missed call recaptures lost leads
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <DollarSign className="w-12 h-12 mx-auto text-primary mb-4" />
                <CardTitle className="text-2xl">High ROI</CardTitle>
                <CardDescription className="text-base">
                  Recovering just a few missed calls per month can cover the cost of the service
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Get Started in Minutes—No Complicated Setup
          </h2>
          <p className="text-lg text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            You don't need extra software or complicated integrations. Just sign up, get your number, and start saving lost leads today.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="relative">
              <div className="absolute -top-4 left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
              <CardHeader>
                <Phone className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Connect Your Business Number</CardTitle>
                <CardDescription>We handle the rest</CardDescription>
              </CardHeader>
            </Card>

            <Card className="relative">
              <div className="absolute -top-4 left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
              <CardHeader>
                <MessageSquare className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Miss a Call? We Auto-Reply</CardTitle>
                <CardDescription>Customers receive a text instantly</CardDescription>
              </CardHeader>
            </Card>

            <Card className="relative">
              <div className="absolute -top-4 left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
              <CardHeader>
                <Users className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Recover More Customers</CardTitle>
                <CardDescription>Simple SMS follow-ups bring them back</CardDescription>
              </CardHeader>
            </Card>
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