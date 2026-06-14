import bcmLogoAsset from "@/assets/bcm-logo.asset.json";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  variant?: "full" | "mark";
};

export function BcmLogo({ className, variant = "full" }: Props) {
  if (variant === "mark") {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-sm bg-primary px-2 py-1 font-display text-sm font-bold tracking-widest text-primary-foreground",
          className,
        )}
      >
        BCM
      </div>
    );
  }
  return (
    <img
      src={bcmLogoAsset.url}
      alt="Bossman Construction Management"
      className={cn("h-12 w-auto", className)}
    />
  );
}