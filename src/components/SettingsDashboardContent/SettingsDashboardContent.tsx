import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SettingsDashboardContentProps = ComponentProps<"div"> & {
  children: ReactNode;
};

export function SettingsDashboardContent({
  children,
  className,
  ...props
}: SettingsDashboardContentProps) {
  return (
    <div className={cn("flex w-full flex-col gap-6", className)} {...props}>
      {children}
    </div>
  );
}
