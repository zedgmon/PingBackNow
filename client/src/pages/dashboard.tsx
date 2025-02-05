import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Phone, CalendarDays, Users } from "lucide-react";
import { MissedCall, ScheduledMessage, Lead } from "@shared/schema";

export default function Dashboard() {
  const { data: missedCalls } = useQuery<MissedCall[]>({
    queryKey: ["/api/missed-calls"],
  });

  const { data: scheduledMessages } = useQuery<ScheduledMessage[]>({
    queryKey: ["/api/scheduled-messages"],
  });

  const { data: leads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const stats = [
    {
      name: "Missed Calls",
      value: missedCalls?.length ?? 0,
      icon: Phone,
      description: "Total missed calls today",
    },
    {
      name: "Scheduled Messages",
      value: scheduledMessages?.length ?? 0,
      icon: CalendarDays,
      description: "Pending follow-ups",
    },
    {
      name: "Active Leads",
      value: leads?.length ?? 0,
      icon: Users,
      description: "Total tracked leads",
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Missed Calls</CardTitle>
              <CardDescription>
                Latest calls that need follow-up
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {missedCalls?.slice(0, 5).map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{call.callerName ?? "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">
                        {call.callerNumber}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(call.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Follow-ups</CardTitle>
              <CardDescription>
                Scheduled messages to be sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledMessages?.slice(0, 5).map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{msg.recipientNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {msg.message.slice(0, 50)}...
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(msg.scheduledTime).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
