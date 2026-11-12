"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Props {
  reportId: string;
  openingOdometer?: number | null;
  closingOdometer?: number | null;
}

/** Opens the opening / closing odometer photos for one daily report (loaded on demand). */
export function OdometerPhotosButton({ reportId, openingOdometer, closingOdometer }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<{ openingOdometerPhoto: string | null; closingOdometerPhoto: string | null } | null>(null);

  const show = async () => {
    setOpen(true);
    if (photos) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/daily-reports/${reportId}/photos`);
      if (res.ok) setPhotos(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const km = openingOdometer != null && closingOdometer != null ? closingOdometer - openingOdometer : null;

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={show}>
        <Camera className="mr-2 h-4 w-4" />
        Odometer
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Odometer{km != null ? ` — ${km.toFixed(1)} km travelled` : ""}</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Opening", openingOdometer, photos?.openingOdometerPhoto],
                ["Closing", closingOdometer, photos?.closingOdometerPhoto],
              ].map(([label, reading, photo]) => (
                <div key={label as string} className="space-y-2">
                  <p className="text-sm font-medium">
                    {label as string}: {reading ?? "—"}
                  </p>
                  {photo ? (
                    <img src={photo as string} alt={`${label} odometer`} className="w-full rounded-lg border object-contain" />
                  ) : (
                    <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No photo</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
