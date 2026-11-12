"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Printer } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";

interface StatementDealer {
  id: string;
  firmName: string;
  city: string;
  invoices: number;
}

interface LedgerEntry {
  kind: "INVOICE" | "PAYMENT" | "CREDIT_NOTE" | "DEBIT_NOTE";
  date: string;
  reference: string;
  description?: string;
  invoiceId?: string;
  debit: number;
  credit: number;
  balance: number;
}

interface Statement {
  dealer: { id: string; firmName: string; city: string; gstNumber: string };
  openingBalance: number;
  entries: LedgerEntry[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

const KIND_LABEL: Record<LedgerEntry["kind"], string> = {
  INVOICE: "Invoice",
  PAYMENT: "Payment",
  CREDIT_NOTE: "Credit note",
  DEBIT_NOTE: "Debit note",
};

/** Positive = dealer owes us (Dr), negative = advance with us (Cr). */
function balanceLabel(amount: number) {
  if (Math.abs(amount) < 0.01) return formatCurrency(0);
  return `${formatCurrency(Math.abs(amount))} ${amount > 0 ? "Dr" : "Cr"}`;
}

export default function DealerStatementPage() {
  const [dealers, setDealers] = useState<StatementDealer[]>([]);
  const [dealerId, setDealerId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statement, setStatement] = useState<Statement | null>(null);
  const [loadingDealers, setLoadingDealers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/statements/dealers")
      .then((r) => r.json())
      .then((data) => setDealers(Array.isArray(data) ? data : []))
      .catch(() => setDealers([]))
      .finally(() => setLoadingDealers(false));
  }, []);

  useEffect(() => {
    if (!dealerId) return;
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    setLoading(true);
    setError(null);
    apiFetch(`/api/statements/${dealerId}?${params.toString()}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Could not load statement");
        setStatement(data);
      })
      .catch((e: Error) => {
        setStatement(null);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [dealerId, from, to]);

  const selected = useMemo(() => dealers.find((d) => d.id === dealerId), [dealers, dealerId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Dealer Statement</h1>
          <p className="text-muted-foreground">Invoices, payments and notes for one dealer (view only)</p>
        </div>
        {statement && (
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        )}
      </div>

      <Card className="print:hidden">
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Dealer</Label>
            <Select value={dealerId} onValueChange={setDealerId} disabled={loadingDealers}>
              <SelectTrigger>
                <SelectValue placeholder={loadingDealers ? "Loading…" : "Select dealer"} />
              </SelectTrigger>
              <SelectContent>
                {dealers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.firmName}
                    {d.city ? ` — ${d.city}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {!dealerId ? (
        <EmptyState
          title={!loadingDealers && dealers.length === 0 ? "No invoices generated yet" : "Select a dealer to view the statement"}
        />
      ) : loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : statement ? (
        <Card>
          <CardHeader>
            <CardTitle>{statement.dealer.firmName || selected?.firmName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {[statement.dealer.city, statement.dealer.gstNumber && `GST: ${statement.dealer.gstNumber}`]
                .filter(Boolean)
                .join(" · ")}
              {(from || to) && ` · ${from ? formatDate(from) : "Start"} to ${to ? formatDate(to) : "today"}`}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Opening balance", balanceLabel(statement.openingBalance)],
                ["Billed (Dr)", formatCurrency(statement.totalDebit)],
                ["Received (Cr)", formatCurrency(statement.totalCredit)],
                ["Closing balance", balanceLabel(statement.closingBalance)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(from || statement.openingBalance !== 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">
                      Opening balance
                    </TableCell>
                    <TableCell className="text-right font-medium">{balanceLabel(statement.openingBalance)}</TableCell>
                  </TableRow>
                )}
                {statement.entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                      No transactions in this period
                    </TableCell>
                  </TableRow>
                ) : (
                  statement.entries.map((e, i) => (
                    <TableRow key={`${e.kind}-${e.reference}-${i}`}>
                      <TableCell className="whitespace-nowrap">{formatDate(e.date)}</TableCell>
                      <TableCell>{KIND_LABEL[e.kind]}</TableCell>
                      <TableCell className="font-medium">
                        {e.invoiceId ? (
                          <Link href={`/print/invoices/${e.invoiceId}`} target="_blank" className="text-brand-700 hover:underline">
                            {e.reference}
                          </Link>
                        ) : (
                          e.reference
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.description}</TableCell>
                      <TableCell className="text-right">{e.debit ? formatCurrency(e.debit) : ""}</TableCell>
                      <TableCell className="text-right text-green-700">{e.credit ? formatCurrency(e.credit) : ""}</TableCell>
                      <TableCell className="text-right font-medium">{balanceLabel(e.balance)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
