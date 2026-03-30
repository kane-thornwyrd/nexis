import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

import {
  ADMIN_ARTS_PATH,
  ADMIN_DATA_PATH,
  ADMIN_HOME_PATH,
  ADMIN_LOG_PATH,
  ADMIN_OVERLAY_MANAGER_PATH,
  ADMIN_PERMISSIONS_PATH,
  ADMIN_PLUGINS_PATH,
  ADMIN_SETTINGS_PATH,
  buildAdminOverlayStudioPath,
  buildRenderSurfacePath,
  buildStagingSurfacePath,
} from "@/app-route-paths";
import {
  DashboardDrawer,
  DashboardDrawerBackground,
  DashboardDrawerPanel,
} from "@/components/DashboardDrawer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getOverlayFormat,
  useNexisProject,
  useOverlayById,
  type OverlayPublicationState,
  type OverlayRecord,
  type ValidationIssue,
} from "@/app-state";

import { OverlayCanvas } from "./OverlayCanvas";

export type AdminView =
  | "start"
  | "settings"
  | "plugins"
  | "permissions"
  | "overlay-manager"
  | "overlay-studio"
  | "data-flow"
  | "history"
  | "art-directions";

type AdminSurfaceProps = {
  view: AdminView;
  overlayId?: string;
};

type DisplayValidationIssue = ValidationIssue & {
  onFix?: () => void;
};

type ServerConfig = {
  name: string;
  port: number;
};

const adminNavigation = [
  { label: "Welcome", path: ADMIN_HOME_PATH, view: "start" },
  { label: "Settings", path: ADMIN_SETTINGS_PATH, view: "settings" },
  { label: "Plugins", path: ADMIN_PLUGINS_PATH, view: "plugins" },
  { label: "Permissions", path: ADMIN_PERMISSIONS_PATH, view: "permissions" },
  {
    label: "Overlay Manager",
    path: ADMIN_OVERLAY_MANAGER_PATH,
    view: "overlay-manager",
  },
  { label: "Data Flow", path: ADMIN_DATA_PATH, view: "data-flow" },
  { label: "History", path: ADMIN_LOG_PATH, view: "history" },
  { label: "Art Directions", path: ADMIN_ARTS_PATH, view: "art-directions" },
] as const;

const sectionCopy: Record<
  AdminView,
  {
    eyebrow: string;
    title: string;
    description: string;
  }
> = {
  start: {
    eyebrow: "Launch pad",
    title: "Start from a sample project state",
    description:
      "This first incomplete slice gives the admin UI real routes, local sample overlays, and render or staging pages driven by the same browser-side state.",
  },
  settings: {
    eyebrow: "Settings",
    title: "Project and runtime settings",
    description:
      "This slice exposes the local project name and server config endpoint while leaving the restart workflow for a later pass.",
  },
  plugins: {
    eyebrow: "Plugins",
    title: "Plugin management placeholder",
    description:
      "The plugin lifecycle model is documented, but this first slice only reserves the section and its intended responsibilities.",
  },
  permissions: {
    eyebrow: "Permissions",
    title: "Permissions manager placeholder",
    description:
      "Permission matrices and approval flows remain future work, but the admin section is now wired and visible.",
  },
  "overlay-manager": {
    eyebrow: "Overlays",
    title: "Overlay manager",
    description:
      "Create sample overlays, inspect the current ones, and jump into the first studio editor or the staging and render routes.",
  },
  "overlay-studio": {
    eyebrow: "Overlay Studio",
    title: "A first editable overlay surface",
    description:
      "This slice provides a minimal overlay editor with field-level issues, status lights, and a live preview tied to browser-local project state.",
  },
  "data-flow": {
    eyebrow: "Data Flow",
    title: "Pipeline status preview",
    description:
      "The first runnable slice stops short of a true Sankey editor, but it already surfaces sample data-flow issues in-context and keeps the section real.",
  },
  history: {
    eyebrow: "History",
    title: "History placeholder",
    description:
      "Event-sourced history and dramatic restore warnings are still ahead, but the admin route exists and can be filled incrementally.",
  },
  "art-directions": {
    eyebrow: "Art Directions",
    title: "Art direction placeholder",
    description:
      "Art direction packaging is not implemented in this slice yet, but the manager route and navigation are already wired in the shell.",
  },
};

const pipelineNodes = [
  {
    id: "scraper-twitch-chat",
    kind: "Scraper",
    name: "Twitch chat",
    status: "healthy",
    summary: "Sample live chat source feeding the unified chat overlay widget.",
  },
  {
    id: "scraper-youtube-chat",
    kind: "Scraper",
    name: "YouTube chat",
    status: "warning",
    summary: "Defined in the sample pipeline, but intentionally left optional for this first incomplete version.",
  },
  {
    id: "retriever-unified-chat",
    kind: "Retriever",
    name: "Unified chat retriever",
    status: "healthy",
    summary: "Combines current chat sources into one downstream overlay-ready stream.",
  },
  {
    id: "resource-support-ribbon",
    kind: "Resource",
    name: "Support ribbon resource",
    status: "blocking",
    summary: "Waiting on a real donation scraper, so fake events remain the current preview path.",
  },
] as const;

const overlayPublicationStates = ["draft", "staged", "live"] as const;

type OverlayDraft = {
  name: string;
  description: string;
  width: string;
  height: string;
  background: string;
};

function createOverlayDraft(overlay: OverlayRecord | null): OverlayDraft {
  return {
    name: overlay?.name ?? "",
    description: overlay?.description ?? "",
    width: overlay ? String(overlay.width) : "",
    height: overlay ? String(overlay.height) : "",
    background: overlay?.background ?? "",
  };
}

function useOverlayDraft(overlay: OverlayRecord | null) {
  const [draft, setDraft] = useState(() => createOverlayDraft(overlay));

  useEffect(() => {
    if (!overlay) {
      return;
    }

    setDraft(createOverlayDraft(overlay));
  }, [overlay]);

  return {
    draft,
    setDraftBackground: (background: string) =>
      setDraft((current) => ({ ...current, background })),
    setDraftDescription: (description: string) =>
      setDraft((current) => ({ ...current, description })),
    setDraftHeight: (height: string) => setDraft((current) => ({ ...current, height })),
    setDraftName: (name: string) => setDraft((current) => ({ ...current, name })),
    setDraftWidth: (width: string) => setDraft((current) => ({ ...current, width })),
  };
}

function createOverlayAndOpenStudio(
  createOverlay: () => OverlayRecord,
  navigate: (path: string) => void,
) {
  const overlay = createOverlay();
  navigate(buildAdminOverlayStudioPath(overlay.id));
}

function buildOverlayPreview(overlay: OverlayRecord, draft: OverlayDraft) {
  const parsedWidth = Number(draft.width);
  const parsedHeight = Number(draft.height);
  const previewWidth =
    Number.isFinite(parsedWidth) && parsedWidth > 0 ? parsedWidth : overlay.width;
  const previewHeight =
    Number.isFinite(parsedHeight) && parsedHeight > 0 ? parsedHeight : overlay.height;
  const previewOverlay: OverlayRecord = {
    ...overlay,
    name: draft.name.trim() || overlay.name,
    description: draft.description,
    width: previewWidth,
    height: previewHeight,
    background: draft.background,
  };

  return {
    parsedWidth,
    parsedHeight,
    previewHeight,
    previewOverlay,
    previewWidth,
  };
}

function getOverlayStudioFormIssues({
  overlay,
  draftName,
  parsedHeight,
  parsedWidth,
  previewHeight,
  previewWidth,
  setDraftHeight,
  setDraftName,
  setDraftWidth,
}: {
  overlay: OverlayRecord;
  draftName: string;
  parsedHeight: number;
  parsedWidth: number;
  previewHeight: number;
  previewWidth: number;
  setDraftHeight: (height: string) => void;
  setDraftName: (name: string) => void;
  setDraftWidth: (width: string) => void;
}): DisplayValidationIssue[] {
  const issues: DisplayValidationIssue[] = [];

  if (!draftName.trim()) {
    issues.push({
      id: "issue-overlay-name",
      level: "blocking",
      scope: "form",
      title: "Overlay name is required.",
      description: "Give the overlay a stable name before saving this first editor state.",
      onFix: () => setDraftName(`Overlay ${overlay.id.replace("overlay-", "")}`),
    });
  }

  if (!Number.isFinite(parsedWidth) || parsedWidth < 320) {
    issues.push({
      id: "issue-overlay-width",
      level: "error",
      scope: "form",
      title: "Overlay width is too small.",
      description: "Use a width of at least 320 so the preview and render surfaces remain usable.",
      onFix: () => setDraftWidth(String(overlay.width)),
    });
  }

  if (!Number.isFinite(parsedHeight) || parsedHeight < 180) {
    issues.push({
      id: "issue-overlay-height",
      level: "error",
      scope: "form",
      title: "Overlay height is too small.",
      description: "Use a height of at least 180 so the preview and render surfaces remain usable.",
      onFix: () => setDraftHeight(String(overlay.height)),
    });
  }

  if (previewWidth < previewHeight) {
    issues.push({
      id: "issue-overlay-portrait",
      level: "warning",
      scope: "form",
      title: "This overlay currently resolves to portrait mode.",
      description: "That is valid in the current model, but check your widget placement before publishing live.",
    });
  }

  return issues;
}

function groupOverlayStudioFieldIssues(issues: DisplayValidationIssue[]) {
  return {
    name: issues.filter((issue) => issue.id === "issue-overlay-name"),
    width: issues.filter((issue) => issue.id === "issue-overlay-width"),
    height: issues.filter((issue) => issue.id === "issue-overlay-height"),
  };
}

function useServerConfig() {
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    fetch("/config.json", { signal: abortController.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        return (await response.json()) as ServerConfig;
      })
      .then((nextConfig) => {
        setConfig(nextConfig);
        setError(null);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Unknown fetch failure.");
      });

    return () => {
      abortController.abort();
    };
  }, []);

  return { config, error };
}

function getIssueBadgeVariant(level: ValidationIssue["level"]) {
  switch (level) {
    case "warning":
      return "secondary" as const;
    case "error":
    case "blocking":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function getNodeBadgeVariant(status: (typeof pipelineNodes)[number]["status"]) {
  switch (status) {
    case "healthy":
      return "default" as const;
    case "warning":
      return "secondary" as const;
    case "blocking":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function OverlayStatusLights({
  publicationState,
}: {
  publicationState: OverlayPublicationState;
}) {
  const steps = [
    { label: "Saved", active: true },
    { label: "Staged", active: publicationState !== "draft" },
    { label: "Live", active: publicationState === "live" },
  ];

  return (
    <div className="flex items-center gap-2">
      {steps.map((step) => (
        <div key={step.label} className="flex items-center gap-1.5">
          <span
            className={cn(
              "size-2 rounded-full border border-white/15",
              step.active ? "bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.55)]" : "bg-muted",
            )}
          />
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function OverlayPublicationActions({
  overlayId,
  publicationState,
  onChange,
}: {
  overlayId: string;
  publicationState: OverlayPublicationState;
  onChange: (overlayId: string, publicationState: OverlayPublicationState) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {overlayPublicationStates.map((stateValue) => (
        <Button
          key={stateValue}
          size="sm"
          variant={publicationState === stateValue ? "default" : "outline"}
          onClick={() => onChange(overlayId, stateValue)}
        >
          {stateValue}
        </Button>
      ))}
    </div>
  );
}

function ValidationIssueList({ issues }: { issues: DisplayValidationIssue[] }) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {issues.map((issue) => (
        <Card key={issue.id} size="sm" className="border border-border/70 bg-card/70">
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getIssueBadgeVariant(issue.level)}>{issue.level}</Badge>
              <Badge variant="outline">{issue.scope}</Badge>
            </div>
            <CardTitle>{issue.title}</CardTitle>
            <CardDescription>{issue.description}</CardDescription>
          </CardHeader>
          {issue.onFix ? (
            <CardContent>
              <Button size="sm" variant="outline" onClick={issue.onFix}>
                Fix this issue
              </Button>
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function DrawerNavigation({ currentPath }: { currentPath: string }) {
  return (
    <nav className="space-y-2">
      {adminNavigation.map((item) => {
        const active = currentPath === item.path;

        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex items-center justify-between rounded-lg border px-3 py-2 text-xs/relaxed transition-colors",
              active
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border/60 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            <span>{item.label}</span>
            <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
              go
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function StartView() {
  const { state } = useNexisProject();
  const portraitCount = state.overlays.filter(
    (overlay) => getOverlayFormat(overlay.width, overlay.height) === "portrait",
  ).length;
  const liveCount = state.overlays.filter(
    (overlay) => overlay.publicationState === "live",
  ).length;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
      <Card className="border border-border/60 bg-card/80 shadow-xl">
        <CardHeader>
          <Badge variant="outline">First runnable slice</Badge>
          <CardTitle>Local project state now drives real app routes.</CardTitle>
          <CardDescription>
            This initial cut is still incomplete, but the admin shell, sample overlays,
            and staging or render views all run from the same browser-local NEXIS
            project state.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Card size="sm" className="border border-border/60 bg-background/50">
            <CardHeader>
              <CardDescription>Overlays</CardDescription>
              <CardTitle>{state.overlays.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm" className="border border-border/60 bg-background/50">
            <CardHeader>
              <CardDescription>Live overlays</CardDescription>
              <CardTitle>{liveCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm" className="border border-border/60 bg-background/50">
            <CardHeader>
              <CardDescription>Portrait overlays</CardDescription>
              <CardTitle>{portraitCount}</CardTitle>
            </CardHeader>
          </Card>
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card/80 shadow-xl">
        <CardHeader>
          <Badge variant="secondary">Quick actions</Badge>
          <CardTitle>Jump into the first working routes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Link
            href={ADMIN_OVERLAY_MANAGER_PATH}
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
          >
            Open overlay manager
          </Link>
          <Link
            href={buildAdminOverlayStudioPath(state.overlays[0]!.id)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Open first overlay studio
          </Link>
          <Link
            href={ADMIN_DATA_PATH}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Inspect sample data flow
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsView() {
  const { config, error } = useServerConfig();
  const { renameProject, state } = useNexisProject();
  const [draftProjectName, setDraftProjectName] = useState(state.projectName);

  useEffect(() => {
    setDraftProjectName(state.projectName);
  }, [state.projectName]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="border border-border/60 bg-card/80 shadow-xl">
        <CardHeader>
          <CardTitle>Project settings</CardTitle>
          <CardDescription>
            The first slice keeps this focused on the local project name and the current
            runtime config endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="space-y-2 text-xs/relaxed text-muted-foreground">
            <span className="block uppercase tracking-[0.18em]">Project name</span>
            <Input
              value={draftProjectName}
              onChange={(event) => setDraftProjectName(event.currentTarget.value)}
              placeholder="NEXIS Project"
            />
          </label>
          <Button
            size="sm"
            onClick={() => renameProject(draftProjectName.trim() || state.projectName)}
          >
            Save project name
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card/80 shadow-xl">
        <CardHeader>
          <CardTitle>Server runtime snapshot</CardTitle>
          <CardDescription>
            Pulled from the existing `/config.json` endpoint so the settings page is
            already connected to the running backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs/relaxed text-muted-foreground">
          {config ? (
            <div className="space-y-2 rounded-lg border border-border/60 bg-background/50 p-3">
              <p>
                <strong className="text-foreground">Name:</strong> {config.name}
              </p>
              <p>
                <strong className="text-foreground">Port:</strong> {config.port}
              </p>
            </div>
          ) : null}
          {error ? <p className="text-destructive">{error}</p> : null}
          {!config && !error ? <p>Loading runtime config...</p> : null}
          <p>
            This slice does not implement the restart modal yet, but it already keeps the
            server config visible in a real route.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function OverlayManagerView() {
  const { createOverlay, setOverlayPublicationState, state } = useNexisProject();
  const [, navigate] = useLocation();

  const handleCreateOverlay = () => {
    createOverlayAndOpenStudio(createOverlay, navigate);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-xs/relaxed text-muted-foreground">
          Overlays are already real project data in this slice. You can create a new one,
          inspect its derived format, and open its staging or render route.
        </p>
        <Button size="sm" onClick={handleCreateOverlay}>
          Create overlay
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {state.overlays.map((overlay) => (
          <Card key={overlay.id} className="border border-border/60 bg-card/80 shadow-xl">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <Badge variant="outline">{getOverlayFormat(overlay.width, overlay.height)}</Badge>
                  <CardTitle>{overlay.name}</CardTitle>
                  <CardDescription>{overlay.description}</CardDescription>
                </div>

                <OverlayStatusLights publicationState={overlay.publicationState} />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-2 text-xs/relaxed text-muted-foreground sm:grid-cols-3">
                <p>
                  <strong className="text-foreground">Size:</strong> {overlay.width} x {overlay.height}
                </p>
                <p>
                  <strong className="text-foreground">Widgets:</strong> {overlay.widgets.length}
                </p>
                <p>
                  <strong className="text-foreground">Publication:</strong> {overlay.publicationState}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildAdminOverlayStudioPath(overlay.id)}
                  className={cn(buttonVariants({ variant: "default", size: "sm" }))}
                >
                  Edit overlay
                </Link>
                <a
                  href={buildStagingSurfacePath(overlay.id)}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Open staging
                </a>
                <a
                  href={buildRenderSurfacePath(overlay.id)}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Open render
                </a>
              </div>

                <OverlayPublicationActions
                  overlayId={overlay.id}
                  publicationState={overlay.publicationState}
                  onChange={setOverlayPublicationState}
                />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function OverlayStudioView({ overlayId }: { overlayId?: string }) {
  const { setOverlayPublicationState, updateOverlay } = useNexisProject();
  const overlay = useOverlayById(overlayId);
  const {
    draft,
    setDraftBackground,
    setDraftDescription,
    setDraftHeight,
    setDraftName,
    setDraftWidth,
  } = useOverlayDraft(overlay);

  if (!overlay) {
    return (
      <Card className="border border-border/60 bg-card/80 shadow-xl">
        <CardHeader>
          <Badge variant="destructive">Overlay unavailable</Badge>
          <CardTitle>The requested overlay is not in the current local project.</CardTitle>
          <CardDescription>
            Return to the overlay manager and open one of the sample records from there.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={ADMIN_OVERLAY_MANAGER_PATH}
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
          >
            Back to overlay manager
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { parsedHeight, parsedWidth, previewHeight, previewOverlay, previewWidth } =
    buildOverlayPreview(overlay, draft);
  const formIssues = getOverlayStudioFormIssues({
    overlay,
    draftName: draft.name,
    parsedHeight,
    parsedWidth,
    previewHeight,
    previewWidth,
    setDraftHeight,
    setDraftName,
    setDraftWidth,
  });
  const fieldIssues = groupOverlayStudioFieldIssues(formIssues);

  const canSave = formIssues.every((issue) => issue.level === "warning");

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    updateOverlay(overlay.id, {
      name: draft.name.trim(),
      description: draft.description.trim(),
      width: previewWidth,
      height: previewHeight,
      background: draft.background,
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="border border-border/60 bg-card/80 shadow-xl">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <Badge variant="outline">{getOverlayFormat(previewWidth, previewHeight)}</Badge>
              <CardTitle>{overlay.name}</CardTitle>
              <CardDescription>
                Edit the first browser-local overlay state and preview the changes before saving.
              </CardDescription>
            </div>
            <OverlayStatusLights publicationState={overlay.publicationState} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block space-y-2 text-xs/relaxed text-muted-foreground">
            <span className="block uppercase tracking-[0.18em]">Overlay name</span>
            <Input value={draft.name} onChange={(event) => setDraftName(event.currentTarget.value)} />
            {fieldIssues.name.map((issue) => (
              <p key={issue.id} className="text-destructive">
                {issue.description}
              </p>
            ))}
          </label>

          <label className="block space-y-2 text-xs/relaxed text-muted-foreground">
            <span className="block uppercase tracking-[0.18em]">Description</span>
            <textarea
              className="min-h-24 w-full rounded-md border border-input bg-input/20 px-2 py-2 text-xs/relaxed outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              value={draft.description}
              onChange={(event) => setDraftDescription(event.currentTarget.value)}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2 text-xs/relaxed text-muted-foreground">
              <span className="block uppercase tracking-[0.18em]">Width</span>
              <Input
                type="number"
                min={320}
                value={draft.width}
                onChange={(event) => setDraftWidth(event.currentTarget.value)}
              />
              {fieldIssues.width.map((issue) => (
                <p key={issue.id} className="text-destructive">
                  {issue.description}
                </p>
              ))}
            </label>

            <label className="block space-y-2 text-xs/relaxed text-muted-foreground">
              <span className="block uppercase tracking-[0.18em]">Height</span>
              <Input
                type="number"
                min={180}
                value={draft.height}
                onChange={(event) => setDraftHeight(event.currentTarget.value)}
              />
              {fieldIssues.height.map((issue) => (
                <p key={issue.id} className="text-destructive">
                  {issue.description}
                </p>
              ))}
            </label>
          </div>

          <label className="block space-y-2 text-xs/relaxed text-muted-foreground">
            <span className="block uppercase tracking-[0.18em]">Background</span>
            <Input
              value={draft.background}
              onChange={(event) => setDraftBackground(event.currentTarget.value)}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleSave} disabled={!canSave}>
              Save overlay draft
            </Button>
            <OverlayPublicationActions
              overlayId={overlay.id}
              publicationState={overlay.publicationState}
              onChange={setOverlayPublicationState}
            />
          </div>

          <ValidationIssueList issues={formIssues} />

          <div className="flex flex-wrap gap-2">
            <a
              href={buildStagingSurfacePath(overlay.id)}
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            >
              Open staging route
            </a>
            <a
              href={buildRenderSurfacePath(overlay.id)}
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            >
              Open render route
            </a>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card/80 shadow-xl">
        <CardHeader>
          <CardTitle>Overlay preview</CardTitle>
          <CardDescription>
            This preview is driven by the same draft values shown in the editor fields.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OverlayCanvas overlay={previewOverlay} mode="preview" />
        </CardContent>
      </Card>
    </div>
  );
}

function DataFlowView() {
  const { state } = useNexisProject();

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="border border-border/60 bg-card/80 shadow-xl">
        <CardHeader>
          <CardTitle>Sample pipeline status</CardTitle>
          <CardDescription>
            This is not the future Sankey editor yet, but the section already exposes a
            real first-class route and surfaces sample pipeline issues in-context.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {pipelineNodes.map((node) => (
            <Card key={node.id} size="sm" className="border border-border/60 bg-background/50">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{node.kind}</Badge>
                  <Badge variant={getNodeBadgeVariant(node.status)}>{node.status}</Badge>
                </div>
                <CardTitle>{node.name}</CardTitle>
                <CardDescription>{node.summary}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card/80 shadow-xl">
        <CardHeader>
          <CardTitle>Current validation issues</CardTitle>
          <CardDescription>
            Pipeline issues are shown in-context here first; notifications remain only a
            supplemental future affordance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ValidationIssueList issues={state.dataFlowIssues} />
          <div className="flex flex-wrap gap-2">
            <Link
              href={ADMIN_SETTINGS_PATH}
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            >
              Review settings
            </Link>
            <Link
              href={ADMIN_OVERLAY_MANAGER_PATH}
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            >
              Review overlays
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlaceholderView({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border border-border/60 bg-card/80 shadow-xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-xs/relaxed text-muted-foreground">
        <p>
          This route is intentionally present already so the first runnable version has a
          coherent admin shell instead of a single blank page.
        </p>
        <p>
          The deeper workflow for this section is still ahead, but navigation, layout,
          and project context are now real.
        </p>
      </CardContent>
    </Card>
  );
}

export function AdminSurface({ overlayId, view }: AdminSurfaceProps) {
  const [location, navigate] = useLocation();
  const { createOverlay, state } = useNexisProject();
  const primaryOverlay = state.overlays[0] ?? null;
  const copy = sectionCopy[view];

  const handleCreateOverlay = () => {
    createOverlayAndOpenStudio(createOverlay, navigate);
  };

  const renderSection = () => {
    switch (view) {
      case "start":
        return <StartView />;
      case "settings":
        return <SettingsView />;
      case "overlay-manager":
        return <OverlayManagerView />;
      case "overlay-studio":
        return <OverlayStudioView overlayId={overlayId} />;
      case "data-flow":
        return <DataFlowView />;
      case "plugins":
        return <PlaceholderView title="Plugin management" description={copy.description} />;
      case "permissions":
        return <PlaceholderView title="Permissions manager" description={copy.description} />;
      case "history":
        return <PlaceholderView title="History log" description={copy.description} />;
      case "art-directions":
        return <PlaceholderView title="Art direction manager" description={copy.description} />;
      default:
        return null;
    }
  };

  return (
    <DashboardDrawer>
      <DashboardDrawerBackground>
        <main className="dashboard-stage__page bg-background text-foreground">
          <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-4">
              <div className="space-y-2">
                <Badge variant="outline">{copy.eyebrow}</Badge>
                <div>
                  <h1 className="font-heading text-3xl font-semibold tracking-tight">
                    {copy.title}
                  </h1>
                  <p className="mt-2 max-w-3xl text-xs/relaxed text-muted-foreground">
                    {copy.description}
                  </p>
                </div>
              </div>

              {primaryOverlay ? (
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={buildStagingSurfacePath(primaryOverlay.id)}
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                  >
                    Open staging
                  </a>
                  <a
                    href={buildRenderSurfacePath(primaryOverlay.id)}
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                  >
                    Open render
                  </a>
                </div>
              ) : null}
            </header>

            {renderSection()}
          </div>
        </main>
      </DashboardDrawerBackground>

      <DashboardDrawerPanel>
        <div className="flex h-full flex-col gap-6">
          <Card className="border border-border/60 bg-card/80 shadow-lg">
            <CardHeader>
              <Badge variant="secondary">Local project</Badge>
              <CardTitle>{state.projectName}</CardTitle>
              <CardDescription>
                Browser-local state shared across the admin shell and the staging or render pages.
              </CardDescription>
            </CardHeader>
          </Card>

          <DrawerNavigation currentPath={location} />

          <Card className="border border-border/60 bg-card/80 shadow-lg">
            <CardHeader>
              <CardTitle>Quick overlay access</CardTitle>
              <CardDescription>
                Jump straight into the sample overlay manager or editor routes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {state.overlays.map((overlay) => (
                <Link
                  key={overlay.id}
                  href={buildAdminOverlayStudioPath(overlay.id)}
                  className={cn(
                    "block rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs/relaxed transition-colors hover:border-border hover:text-foreground",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{overlay.name}</span>
                    <Badge variant="outline">{getOverlayFormat(overlay.width, overlay.height)}</Badge>
                  </div>
                </Link>
              ))}

              <Button
                size="sm"
                variant="outline"
                onClick={handleCreateOverlay}
              >
                Create another sample overlay
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardDrawerPanel>
    </DashboardDrawer>
  );
}