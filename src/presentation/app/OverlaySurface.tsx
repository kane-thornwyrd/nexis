import { Link } from "wouter";

import { ADMIN_HOME_PATH } from "@/app-route-paths";
import { useOverlayById } from "@/app-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { OverlayCanvas } from "./OverlayCanvas";

type OverlaySurfaceProps = {
  overlayId: string;
  mode: "staging" | "render";
};

export function OverlaySurface({ overlayId, mode }: OverlaySurfaceProps) {
  const overlay = useOverlayById(overlayId);

  if (!overlay) {
    return (
      <main className="min-h-screen bg-black px-4 py-12 text-foreground">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center">
          <Card className="w-full max-w-xl border border-border/70 bg-card/90 shadow-2xl">
            <CardHeader>
              <Badge variant="destructive">Overlay unavailable</Badge>
              <CardTitle>That overlay is not available in this first slice.</CardTitle>
              <CardDescription>
                Return to the admin UI and create or select one of the sample
                overlays before opening the render or staging route.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href={ADMIN_HOME_PATH}
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                Return to admin
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto flex min-h-screen w-full max-w-400 items-center justify-center">
        <OverlayCanvas
          overlay={overlay}
          mode={mode}
          className="w-full max-w-[min(100vw-2rem,1400px)]"
        />
      </div>
    </main>
  );
}