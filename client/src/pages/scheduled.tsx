import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  insertScheduledMessageSchema,
  ScheduledMessage
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Scheduled() {
  const { data: messages, isLoading } = useQuery<ScheduledMessage[]>({
    queryKey: ["/api/scheduled-messages"],
  });

  const form = useForm({
    resolver: zodResolver(
      insertScheduledMessageSchema.omit({ userId: true, sent: true })
    ),
    defaultValues: {
      recipientNumber: "",
      message: "",
      scheduledTime: new Date(),
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/scheduled-messages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-messages"] });
      form.reset();
    },
  });

  return (
    <DashboardShell>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Scheduled Messages
        </h1>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold mb-4">Schedule New Message</h2>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => scheduleMutation.mutate(data))}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="recipientNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+1234567890" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter your message here"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduledTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Schedule Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP HH:mm:ss")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={scheduleMutation.isPending}
                >
                  {scheduleMutation.isPending
                    ? "Scheduling..."
                    : "Schedule Message"}
                </Button>
              </form>
            </Form>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Scheduled Messages</h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : messages?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No scheduled messages
                      </TableCell>
                    </TableRow>
                  ) : (
                    messages?.map((msg) => (
                      <TableRow key={msg.id}>
                        <TableCell>{msg.recipientNumber}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {msg.message}
                        </TableCell>
                        <TableCell>
                          {new Date(msg.scheduledTime).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={msg.sent ? "default" : "secondary"}>
                            {msg.sent ? "Sent" : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
