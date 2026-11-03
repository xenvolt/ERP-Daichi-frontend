"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Users } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

const reports = [
  {
    title: "Sales Report",
    description: "Zone-wise sales from live orders",
    icon: BarChart3,
    href: "/dashboard/reports/sales",
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Dealer Performance",
    description: "Top dealers and outstanding balances",
    icon: Users,
    href: "/dashboard/reports/dealers",
    color: "bg-green-100 text-green-600",
  },
];

export default function ReportsPage() {
  const [stats, setStats] = useState<{
    ordersThisMonth: number;
    revenueMtd: number;
    pendingDealerApprovals: number;
    overdueInvoices: number;
  } | null>(null);
  const [analytics, setAnalytics] = useState<{
    topDealers: Array<{ dealerName: string; revenue: number; invoiceCount: number }>;
  } | null>(null);

  useEffect(() => {
    apiFetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));

    apiFetch("/api/reports/analytics?limit=5")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return setAnalytics(null);
        setAnalytics({
          topDealers: data.topDealers || [],
        });
      })
      .catch(() => setAnalytics(null));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Business reports and performance analytics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.title} className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${report.color}`}>
                <report.icon className="h-6 w-6" />
              </div>
              <CardTitle className="mt-4">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link href={report.href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>This month (live)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-600">Orders</p>
              <p className="text-2xl font-bold">{stats?.ordersThisMonth ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-600">Revenue</p>
              <p className="text-2xl font-bold">
                {stats ? formatCurrency(stats.revenueMtd) : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-orange-50 p-4">
              <p className="text-sm text-orange-600">Pending dealers</p>
              <p className="text-2xl font-bold">{stats?.pendingDealerApprovals ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-600">Overdue invoices</p>
              <p className="text-2xl font-bold">{stats?.overdueInvoices ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top dealers</CardTitle>
            <Button variant="link" asChild className="h-auto p-0">
              <Link href="/dashboard/reports/dealers">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!analytics?.topDealers?.length ? (
              <p className="text-sm text-muted-foreground">No dealer invoices this month.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dealer</TableHead>
                    <TableHead className="text-right">Invoices</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topDealers.map((d, i) => (
                    <TableRow key={`${d.dealerName}-${i}`}>
                      <TableCell className="font-medium">{d.dealerName || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{d.invoiceCount}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(d.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
