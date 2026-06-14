import { useEffect, useState } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  userId: string;
  value: string[];
  onChange: (paths: string[]) => void;
};

/**
 * Multi-image uploader for material photos.
 * Stores object paths (e.g. "<userId>/<uuid>.jpg") in `value`; displays via signed URLs.
 */
export function MaterialPhotoUpload({ userId, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = value.filter((p) => !previews[p]);
      if (!missing.length) return;
      const { data } = await supabase.storage
        .from("material-photos")
        .createSignedUrls(missing, 60 * 60);
      if (cancelled || !data) return;
      const next = { ...previews };
      data.forEach((d, i) => {
        if (d.signedUrl) next[missing[i]] = d.signedUrl;
      });
      setPreviews(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("material-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
        continue;
      }
      uploaded.push(path);
    }
    setUploading(false);
    if (uploaded.length) onChange([...value, ...uploaded]);
  }

  async function remove(path: string) {
    onChange(value.filter((p) => p !== path));
    await supabase.storage.from("material-photos").remove([path]);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {value.map((path) => (
          <div key={path} className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
            {previews[path] ? (
              <img src={previews[path]} alt="Material" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <button
              type="button"
              onClick={() => remove(path)}
              className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 shadow transition-opacity group-hover:opacity-100"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span>{uploading ? "Uploading…" : "Add photo"}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}

/** Hook to resolve stored photo paths to short-lived signed URLs for display. */
export function useSignedPhotoUrls(paths: string[] | null | undefined) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    if (!paths?.length) {
      setUrls([]);
      return;
    }
    supabase.storage
      .from("material-photos")
      .createSignedUrls(paths, 60 * 60)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setUrls(data.map((d) => d.signedUrl).filter(Boolean) as string[]);
      });
    return () => {
      cancelled = true;
    };
  }, [paths?.join("|")]);
  return urls;
}