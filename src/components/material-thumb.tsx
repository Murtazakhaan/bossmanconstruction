import { useSignedPhotoUrls } from "@/components/material-photo-upload";
import { ImageOff } from "lucide-react";

type Props = {
  paths: string[] | null | undefined;
  alt: string;
  className?: string;
};

/** Renders the first photo of a material as a thumbnail using a signed URL. */
export function MaterialThumb({ paths, alt, className }: Props) {
  const first = paths?.[0] ? [paths[0]] : [];
  const urls = useSignedPhotoUrls(first);
  return (
    <div className={`relative aspect-[16/10] w-full overflow-hidden rounded-md border border-border bg-muted ${className ?? ""}`}>
      {urls[0] ? (
        <img src={urls[0]} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <ImageOff className="h-6 w-6 opacity-50" />
        </div>
      )}
    </div>
  );
}