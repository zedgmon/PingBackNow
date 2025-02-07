import { useQuery } from "@tanstack/react-query";
import AdminLayout from "./layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, MessageSquare, DollarSign } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: topCustomers } = useQuery({
    queryKey: ["/api/admin/top-customers"],
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Active Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeCustomers ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                +{stats?.newCustomersThisMonth ?? 0} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total SMS Sent (This Month)
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSmsSent ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Across all customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats?.monthlyRevenue?.toLocaleString() ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.revenueGrowth > 0 ? "+" : ""}
                {stats?.revenueGrowth ?? 0}% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers by Usage</CardTitle>
            <CardDescription>
              Customers with the highest SMS usage this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>SMS Sent</TableHead>
                  <TableHead>Credit Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers?.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.businessName}
                    </TableCell>
                    <TableCell>{customer.subscriptionPlan}</TableCell>
                    <TableCell>{customer.smsSent}</TableCell>
                    <TableCell>${customer.creditBalance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
