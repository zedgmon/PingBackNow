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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  twilioAccountSid: z.string().min(1, "Account SID is required"),
  twilioAuthToken: z.string().min(1, "Auth Token is required"),
  twilioPhoneNumber: z.string().min(1, "Phone number is required"),
  autoResponseMessage: z.string().min(1, "Auto-response message is required"),
});

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      twilioAccountSid: user?.twilioAccountSid || "",
      twilioAuthToken: user?.twilioAuthToken || "",
      twilioPhoneNumber: user?.twilioPhoneNumber || "",
      autoResponseMessage: user?.autoResponseMessage || "Hi! We missed your call. How can we help?",
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
              <CardTitle>Twilio Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) =>
                    updateSettingsMutation.mutate(data)
                  )}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="twilioAccountSid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twilio Account SID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="AC..." type="password" />
                        </FormControl>
                        <FormDescription>
                          Find this in your Twilio dashboard under Account Info
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twilioAuthToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twilio Auth Token</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormDescription>
                          Your Twilio authentication token
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twilioPhoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twilio Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+1234567890" />
                        </FormControl>
                        <FormDescription>
                          The phone number you purchased from Twilio
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
                    {updateSettingsMutation.isPending
                      ? "Saving..."
                      : "Save Settings"}
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
