import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";

interface CreditUsageData {
  currentBalance: number;
  usage: Array<{
    date: string;
    count: number;
  }>;
  totalMessagesLast30Days: number;
}

export function CreditUsageChart() {
  const { data, isLoading } = useQuery<CreditUsageData>({
    queryKey: ["/api/credit-usage"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Usage</CardTitle>
          <CardDescription>Loading usage data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formattedData = data?.usage.map((item) => ({
    date: format(parseISO(item.date), "MMM d"),
    messages: item.count,
  }));

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Credit Usage Overview</CardTitle>
        <CardDescription>
          Current Balance: ${data?.currentBalance?.toFixed(2)} | Messages Sent (30 days):{" "}
          {data?.totalMessagesLast30Days ?? 0}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="#2563eb"
                fillOpacity={1}
                fill="url(#colorMessages)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}