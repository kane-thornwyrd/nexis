import {
  DashboardDrawer,
  DashboardDrawerBackground,
} from "@/components/DashboardDrawer";
import { EmptyPage } from "@/components/EmptyPage";

export function EmptyDashboardPage() {
  return (
    <DashboardDrawerBackground>
      <EmptyPage className="dashboard-stage__page" />
    </DashboardDrawerBackground>
  );
}
