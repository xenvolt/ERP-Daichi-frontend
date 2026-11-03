"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function DailyLogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logDate: new Date().toISOString(),
          summary,
        }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/dashboard/field/history"), 1200);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Could not save. Try again.");
      }
    } catch {
      alert("Network error. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
        <h2 className="mt-4 text-2xl font-bold">Saved!</h2>
        <p className="text-muted-foreground">Opening your field history…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-8">
      <div>
          <h1 className="text-xl sm:text-2xl font-bold">Daily work log</h1>
          <p className="text-sm text-muted-foreground">Today — {new Date().toLocaleDateString("en-IN")}</p>
        </div>

      <form onSubmit={submit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What did you do today?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="summary">Note *</Label>
              <Textarea
                id="summary"
                required
                rows={4}
                className="text-base min-h-[100px]"
                placeholder="Anything that is not already in the plan, closing report, or a dealer visit"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Submit today&apos;s log
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
