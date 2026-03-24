import { IconSparkles } from "@tabler/icons-react";

import {
  ASSET_OPTIONS,
  CHART_SWATCHES,
  RECENT_SIGNALS,
  type AssetToggleState,
  type DeliveryOption,
} from "@/APITester.shared";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboardDrawerContext } from "@/components/DashboardDrawer";
import { Separator } from "@/components/ui/separator";

type BackgroundPreviewProps = {
  activeAssetCount: number;
  assetToggles: AssetToggleState;
  displayName: string;
  notes: string;
  overlayTitle: string;
  selectedDeliveryMode: DeliveryOption;
};

export function BackgroundPreview({
  activeAssetCount,
  assetToggles,
  displayName,
  notes,
  overlayTitle,
  selectedDeliveryMode,
}: BackgroundPreviewProps) {
  const { dashboardOpen } = useDashboardDrawerContext();
  const ActiveDeliveryIcon = selectedDeliveryMode.icon;
  const notesPreview =
    notes.length > 220 ? `${notes.slice(0, 217).trimEnd()}...` : notes;
  const activeAssetLabels = ASSET_OPTIONS.filter(
    (option) => assetToggles[option.key],
  ).map((option) => option.label);

  return (
    <div className="dashboard-stage__page">
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge>
              <IconSparkles data-icon="inline-start" />
              Live preview canvas
            </Badge>
            <Badge variant={dashboardOpen ? "default" : "outline"}>
              {dashboardOpen ? "Dashboard open" : "Dashboard hidden"}
            </Badge>
            <Badge variant="secondary">
              <ActiveDeliveryIcon data-icon="inline-start" />
              {selectedDeliveryMode.label}
            </Badge>
          </div>

          <div className="flex flex-col gap-2">
            <CardTitle>{overlayTitle}</CardTitle>
            <CardDescription>
              The current page stays visible as the base canvas. Use the fixed
              left-edge handle to deploy the dashboard over it.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <div className="flex min-h-80 flex-col justify-between border border-border bg-linear-to-br from-primary/12 via-background to-chart-1/18 p-5 shadow-lg shadow-black/5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{displayName}</Badge>
              <Badge variant="secondary">Dark mode</Badge>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Broadcast status</span>
                <span className="font-medium">Operator ready</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {CHART_SWATCHES.slice(0, 3).map((swatch) => (
                  <div
                    key={`preview-${swatch.label}`}
                    className="flex flex-col gap-2 border border-border bg-card/70 p-3"
                  >
                    <span className="text-muted-foreground">
                      {swatch.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2 rounded-full"
                        style={{ backgroundColor: `var(${swatch.variable})` }}
                      />
                      <span className="font-medium">Live</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <Card size="sm">
              <CardContent className="flex flex-col gap-1">
                <span className="text-muted-foreground">Theme</span>
                <span className="font-medium">Dark</span>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardContent className="flex flex-col gap-1">
                <span className="text-muted-foreground">Asset toggles</span>
                <span className="font-medium">{activeAssetCount} active</span>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardContent className="flex flex-col gap-2">
                <span className="text-muted-foreground">
                  Visible asset lanes
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeAssetLabels.length > 0 ? (
                    activeAssetLabels.map((label) => (
                      <Badge key={label} variant="outline">
                        {label}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">None armed</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Recent signals</CardTitle>
            <CardDescription>
              A minimal page layer stays in place under the dashboard instead of
              getting replaced by it.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ul className="flex flex-col gap-4" aria-label="Recent signals">
              {RECENT_SIGNALS.map((signal, index) => (
                <li key={signal.title} className="flex flex-col gap-2">
                  {index > 0 ? <Separator /> : null}
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{signal.title}</span>
                    <span className="text-muted-foreground">
                      {signal.detail}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operator brief</CardTitle>
            <CardDescription>
              This is the page slice that remains visible when the dashboard is
              open over the left 90% of the viewport.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-3">
            <span className="text-muted-foreground">Notes preview</span>
            <p>{notesPreview}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
