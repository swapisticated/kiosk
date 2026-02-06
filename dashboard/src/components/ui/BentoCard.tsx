import { cn } from "@/lib/utils";

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  colSpan?: number; // Grid column span
  rowSpan?: number; // Grid row span
  noPadding?: boolean;
}

export function BentoCard({
  className,
  colSpan = 1,
  rowSpan = 1,
  noPadding = false,
  children,
  ...props
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-[2rem] border border-border/50",
        "shadow-soft transition-shadow hover:shadow-hover",
        noPadding ? "p-0" : "p-6",
        // Grid spanning classes (mapping 1-4 for typical bento grids)
        colSpan === 2 && "col-span-1 md:col-span-2",
        colSpan === 3 && "col-span-1 md:col-span-3",
        colSpan === 4 && "col-span-1 md:col-span-4",
        rowSpan === 2 && "row-span-1 md:row-span-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
