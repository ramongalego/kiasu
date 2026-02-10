import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-card p-6 shadow-sm transition-all duration-200 hover:border-border",
        className,
      )}
      {...props}
    />
  );
}
