import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SiTwilio } from "react-icons/si";
import { ExternalLink } from "lucide-react";

const settingsSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
  autoResponseMessage: z.string().min(1, "Auto-response message is required"),
});

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      phoneNumber: user?.twilioPhoneNumber || "",
      autoResponseMessage:
        user?.autoResponseMessage || "Hi! We missed your call. How can we help?",
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your settings have been successfully saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <DashboardShell>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <SiTwilio className="w-6 h-6" />
                <div>
                  <CardTitle>Messaging Configuration</CardTitle>
                  <CardDescription>
                    Configure your business phone number and messaging settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertTitle>Add Your Business Phone Number</AlertTitle>
                <AlertDescription>
                  <p className="mt-2">
                    Enter the phone number you want to use for your business communications.
                    Our system will handle all the messaging infrastructure for you.
                  </p>
                  <p className="mt-2">
                    You'll only be charged for the messages you send and receive through
                    the platform. No technical setup required!
                  </p>
                </AlertDescription>
              </Alert>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) =>
                    updateSettingsMutation.mutate(data)
                  )}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+1234567890" />
                        </FormControl>
                        <FormDescription>
                          Your business phone number (in E.164 format, e.g., +1234567890)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="autoResponseMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auto-Response Message</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter your automatic response message"
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormDescription>
                          This message will be sent automatically when you miss a call
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}