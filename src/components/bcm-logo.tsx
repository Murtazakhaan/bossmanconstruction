import lightLogo from "@/assets/bossman-logo-light.png.asset.json";
import darkLogo from "@/assets/bossman-logo-dark.png.asset.json";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** "full" = responsive size, "mark" = compact. "onDark" forces the light/white logo regardless of theme (use on dark surfaces like the sidebar). */
  variant?: "full" | "mark" | "onDark";
};

export function BcmLogo({ className, variant = "full" }: Props) {
  const sizeClass = variant === "mark" ? "h-8 w-auto" : "h-12 w-auto";
  const alt = "Bossman Construction Management";

  if (variant === "onDark") {
    return (
      <img src={darkLogo.url} alt={alt} className={cn(sizeClass, "object-contain", className)} />
    );
  }

  return (
    <>
      <img
        src={lightLogo.url}
        alt={alt}
        className={cn(sizeClass, "object-contain dark:hidden", className)}
      />
      <img
        src={darkLogo.url}
        alt={alt}
        className={cn(sizeClass, "hidden object-contain dark:block", className)}
      />
    </>
  );
}