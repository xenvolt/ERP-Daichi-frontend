"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ListEditor } from "@/components/field/ListEditor";
import { PhotoCaptureField } from "@/components/shared/PhotoCaptureField";

export default function DailyClosingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [done, setDone] = useState(false);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [alreadyClosed, setAlreadyClosed] = useState(false);
  const [openingOdometer, setOpeningOdometer] = useState<number | null>(null);
  const [placesVisited, setPlacesVisited] = useState<string[]>([""]);
  const [salesAchievement, setSalesAchievement] = useState("");
  const [collectionAchievement, setCollectionAchievement] = useState("");
  const [closingOdometer, setClosingOdometer] = useState("");
  const [odometerPhoto, setOdometerPhoto] = useState<string | null>(null);
  const [dcrId, setDcrId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/daily-reports/today")
      .then((r) => r.json())
      .then((today) => {
        if (!today?.hasActivity) {
          setBlockMessage("Submit today's Daily Activity Report first.");
          return;
        }
        if (today.hasClosing) {
          setAlreadyClosed(true);
          setDcrId(today.dcrId || null);
          return;
        }
        setOpeningOdometer(today.activity?.openingOdometer ?? null);
        setPlacesVisited(today.activity?.placesToVisit?.length ? today.activity.placesToVisit : [""]);
      })
      .finally(() => setBooting(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!odometerPhoto) {
      alert("Upload a photo of the closing odometer.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/daily-reports/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          closingOdometer: Number(closingOdometer),
          closingOdometerPhoto: odometerPhoto,
          placesVisited,
          salesAchievement: Number(salesAchievement),
          collectionAchievement: Number(collectionAchievement),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDcrId(data.dcrId || null);
        setDone(true);
        setTimeout(() => router.push("/dashboard/field/history"), 1100);
      } else {
        alert(data.error || "Could not save Daily Closing Report.");
      }
    } catch {
      alert("Network error. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  if (booting) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
        <h2 className="mt-4 text-2xl font-bold">Day closed & locked</h2>
        <p className="text-muted-foreground">Closing report saved{dcrId ? ` (${dcrId})` : ""}.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Daily Closing Report</h1>
        <p className="text-sm text-muted-foreground">Actual work for {new Date().toLocaleDateString("en-IN")}</p>
      </div>

      {blockMessage && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="font-medium">{blockMessage}</p>
            <Button className="w-full" onClick={() => router.push("/dashboard/field/activity")}>
              Open Daily Activity Report
            </Button>
          </CardContent>
        </Card>
      )}

      {alreadyClosed && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
            {dcrId && <p className="font-medium text-foreground">DCR ID: {dcrId}</p>}
            <p>
              Today&apos;s closing report is already submitted and locked. Historical records are kept and cannot be
              submitted twice.
            </p>
          </CardContent>
        </Card>
      )}

      {!blockMessage && !alreadyClosed && (
        <form onSubmit={submit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">End-of-day actuals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="closingOdometer">Closing odometer *</Label>
                <Input id="closingOdometer" type="number" min={openingOdometer ?? 0} step="0.1" required className="h-12 text-lg" value={closingOdometer} onChange={(e) => setClosingOdometer(e.target.value)} />
                {openingOdometer != null && (
                  <p className="text-xs text-muted-foreground">Opening reading today: {openingOdometer}</p>
                )}
              </div>
              <PhotoCaptureField
                label="Closing odometer photo"
                hint="Take a clear photo of the odometer reading"
                value={odometerPhoto}
                onChange={setOdometerPhoto}
                required
                maxDimension={1280}
              />
              <ListEditor label="Places visited *" values={placesVisited} onChange={setPlacesVisited} placeholder="Place visited" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sales achievement (₹) *</Label>
                  <Input type="number" min={0} required className="h-12 text-lg" value={salesAchievement} onChange={(e) => setSalesAchievement(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Collection achievement (₹) *</Label>
                  <Input type="number" min={0} required className="h-12 text-lg" value={collectionAchievement} onChange={(e) => setCollectionAchievement(e.target.value)} />
                </div>
              </div>
              <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Submit closing report
              </Button>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
