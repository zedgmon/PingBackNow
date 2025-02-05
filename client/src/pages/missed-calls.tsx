import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MissedCall } from "@shared/schema";

export default function MissedCalls() {
  const { data: missedCalls, isLoading } = useQuery<MissedCall[]>({
    queryKey: ["/api/missed-calls"],
  });

  return (
    <DashboardShell>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Missed Calls</h1>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caller Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Time</TableHead>
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
              ) : missedCalls?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No missed calls yet
                  </TableCell>
                </TableRow>
              ) : (
                missedCalls?.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>{call.callerName ?? "Unknown"}</TableCell>
                    <TableCell>{call.callerNumber}</TableCell>
                    <TableCell>
                      {new Date(call.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={call.responded ? "default" : "destructive"}
                      >
                        {call.responded ? "Responded" : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardShell>
  );
}
