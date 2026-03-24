import { cn } from "@/lib/utils";

type EmptyPageProps = {
  className?: string;
};

export function EmptyPage({ className }: EmptyPageProps) {
  return <div className={cn("min-h-screen", className)} />;
}
