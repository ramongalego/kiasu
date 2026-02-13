import { cn, getInitials } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeStyles = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-xl",
};

const imageSizes = { sm: 32, md: 40, lg: 48, xl: 80 };

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name ?? "Avatar"}
        width={imageSizes[size]}
        height={imageSizes[size]}
        className={cn("rounded-full object-cover", sizeStyles[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium",
        sizeStyles[size],
        className,
      )}
    >
      {name ? getInitials(name) : "?"}
    </div>
  );
}
