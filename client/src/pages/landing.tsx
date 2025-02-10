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
import {
  MessageCircle,
  Phone,
  CalendarDays,
  Users,
  Calculator,
  DollarSign,
  Percent,
  Check,
  PhoneOff,
  ArrowUpRight,
  MessageSquare,
  ArrowRight,
  PlayCircle,
  ChevronRight,
  Star,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background" />
          <div className="absolute w-[500px] h-[500px] -right-40 -top-40 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute w-[500px] h-[500px] -left-40 top-40 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Turn Missed Calls into Business Opportunities
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Instantly respond to missed calls with automated SMS follow-ups. Never lose another lead to voicemail again.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto group">
                  Start Converting Missed Calls
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={() => {
                const featuresSection = document.getElementById('features');
                if (featuresSection) {
                  featuresSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}>
                See How It Works
                <PlayCircle className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>14-Day Free Trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30" id="features">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to never miss another business opportunity
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-primary/20" />
            {[
              {
                title: "Miss a Call",
                description: "When a customer call goes unanswered",
                icon: PhoneOff,
                step: 1,
              },
              {
                title: "Instant SMS Response",
                description: "Automated text message is sent immediately",
                icon: MessageSquare,
                step: 2,
              },
              {
                title: "Convert to Customer",
                description: "Turn missed calls into opportunities",
                icon: Users,
                step: 3,
              },
            ].map((step, index) => (
              <div key={step.title} className="relative">
                <div className="absolute -top-4 left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold z-10">
                  {step.step}
                </div>
                <Card className="relative bg-background border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <step.icon className="w-12 h-12 text-primary mb-4" />
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground">
              Powerful features to help you manage and grow your business
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Instant Response",
                description: "Automated SMS sent immediately after missed calls",
                icon: MessageCircle,
              },
              {
                title: "Smart Scheduling",
                description: "Schedule follow-ups and reminders automatically",
                icon: CalendarDays,
              },
              {
                title: "Lead Tracking",
                description: "Track and manage all your leads in one place",
                icon: Users,
              },
              {
                title: "Call Analytics",
                description: "Detailed insights into your call patterns",
                icon: Phone,
              },
              {
                title: "Custom Messages",
                description: "Personalize your automated responses",
                icon: MessageSquare,
              },
              {
                title: "Business Hours",
                description: "Set different responses for business hours",
                icon: CalendarDays,
              },
            ].map((feature) => (
              <Card key={feature.title} className="group hover:shadow-md transition-all duration-200 bg-background border">
                <CardHeader>
                  <div className="mb-4 rounded-lg w-12 h-12 flex items-center justify-center bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of businesses already using our platform
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {[
                  {
                    quote: "Since implementing this system, we've seen a 40% increase in lead conversion from missed calls. It's been a game-changer for our business.",
                    author: "Sarah Johnson",
                    role: "Marketing Director",
                    company: "Tech Solutions Inc",
                  },
                  {
                    quote: "The automated responses have saved us countless hours and helped us capture leads we would have otherwise lost. Highly recommended!",
                    author: "Michael Chen",
                    role: "Business Owner",
                    company: "Chen Consulting",
                  },
                  {
                    quote: "Easy to set up and the customer support is fantastic. Our clients love getting immediate responses when we can't answer their calls.",
                    author: "Emily Rodriguez",
                    role: "Operations Manager",
                    company: "ServicePro LLC",
                  },
                ].map((testimonial, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <Card className="border-2 h-full">
                      <CardHeader>
                        <div className="flex items-center gap-1 text-primary mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                        <CardDescription className="text-foreground">
                          "{testimonial.quote}"
                        </CardDescription>
                        <div className="mt-4">
                          <p className="font-semibold">{testimonial.author}</p>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.role}, {testimonial.company}
                          </p>
                        </div>
                      </CardHeader>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </section>

      {/* Lead Capture Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg opacity-90 mb-8">
              Join thousands of businesses using our platform to grow their customer base and increase revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto group"
                >
                  Start Your Free Trial
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm opacity-75">No credit card required</p>
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

      {/* How It Works Section (already included above) */}

      {/* CTA Section (already included above) */}

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Business Auto-Responder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}