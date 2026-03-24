import { cn } from "@/lib/utils";
import {
  DashboardDrawer,
  DashboardDrawerBackground,
  DashboardDrawerPanel,
} from "../DashboardDrawer";

type EmptyPageProps = {
  className?: string;
};

export function EmptyPage({ className }: EmptyPageProps) {
  return (
    <DashboardDrawer>
      <DashboardDrawerPanel>
        <h1>Empty Page</h1>
      </DashboardDrawerPanel>
      <DashboardDrawerBackground>
        <div className={cn("min-h-screen", className)}>
          <h1>ffffffffffffffffff</h1>
        </div>
      </DashboardDrawerBackground>
    </DashboardDrawer>
  );
}
