import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("v18-stat-card p-6", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm v18-text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold v18-text-heading">{value}</p>
          {trend && (
            <p className="mt-1 text-xs text-v18-success">{trend}</p>
          )}
        </div>
        <div className="rounded-xl v18-surface-accent p-3">
          <Icon className="size-5 text-v18-primary" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
