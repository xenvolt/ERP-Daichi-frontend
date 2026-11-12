"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

function readPhotoAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Downscale to fit maxDimension and re-encode as JPEG, so uploads stay small. */
function downscalePhoto(dataUrl: string, maxDimension: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    // Formats the browser can't decode (e.g. HEIC on desktop) are sent as-is.
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

interface PhotoCaptureFieldProps {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  required?: boolean;
  className?: string;
  /** When set, photos are resized to fit this many pixels on the long side. */
  maxDimension?: number;
}

export function PhotoCaptureField({
  label,
  hint = "Take a photo with your camera or upload from gallery",
  value,
  onChange,
  required = false,
  className,
  maxDimension,
}: PhotoCaptureFieldProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);

  const handleFile = async (file: File | undefined) => {
    if (!file || processingRef.current) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      alert("Photo must be under 4MB.");
      return;
    }

    processingRef.current = true;
    try {
      const dataUrl = await readPhotoAsBase64(file);
      onChange(maxDimension ? await downscalePhoto(dataUrl, maxDimension) : dataUrl);
    } catch {
      alert("Could not read photo. Try again.");
    } finally {
      processingRef.current = false;
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const removePhoto = () => {
    onChange(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>
        {label}
        {required && " *"}
      </Label>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      {value ? (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
          <img
            src={value}
            alt={label}
            className="max-h-48 w-full rounded-lg border object-contain bg-background"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="mr-2 h-4 w-4" />
              Retake photo
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 text-destructive hover:text-destructive"
              onClick={removePhoto}
            >
              <X className="mr-2 h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-14 justify-start text-base"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="mr-3 h-5 w-5 shrink-0" />
            Take photo
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-14 justify-start text-base"
            onClick={() => uploadInputRef.current?.click()}
          >
            <ImagePlus className="mr-3 h-5 w-5 shrink-0" />
            Upload photo
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Camera className="h-3 w-3 shrink-0" />
        {hint}
      </p>
    </div>
  );
}
