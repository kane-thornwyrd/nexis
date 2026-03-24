import {
  IconAdjustmentsHorizontal,
  IconBrowserCheck,
  IconLayoutGrid,
  IconPalette,
  IconSparkles,
  IconTypography,
} from "@tabler/icons-react";

import {
  ASSET_OPTIONS,
  CHART_SWATCHES,
  DELIVERY_OPTIONS,
  THEME_BADGES,
  type AssetToggleKey,
  type AssetToggleState,
  type DeliveryMode,
  type DeliveryOption,
} from "@/APITester.shared";
import Checkbox from "@/components/Checkbox/Checkbox";
import { HtmlFontSizeSlider } from "@/components/HtmlFontSizeSlider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription as FieldHint,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type SettingsDashboardDemoProps = {
  activeAssetCount: number;
  assetToggles: AssetToggleState;
  canUndo: boolean;
  deliveryMode: DeliveryMode;
  displayName: string;
  notes: string;
  onAssetToggleChange: (assetKey: AssetToggleKey, checked: boolean) => void;
  onDeliveryModeChange: (value: DeliveryMode) => void;
  onDisplayNameChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onOverlayTitleChange: (value: string) => void;
  onResetDraft: () => void;
  onUndo: () => void;
  overlayTitle: string;
  selectedDeliveryMode: DeliveryOption;
};

const isDeliveryMode = (value: string): value is DeliveryMode => {
  return DELIVERY_OPTIONS.some((option) => option.value === value);
};

export function SettingsDashboardDemo({
  activeAssetCount,
  assetToggles,
  canUndo,
  deliveryMode,
  displayName,
  notes,
  onAssetToggleChange,
  onDeliveryModeChange,
  onDisplayNameChange,
  onNotesChange,
  onOverlayTitleChange,
  onResetDraft,
  onUndo,
  overlayTitle,
  selectedDeliveryMode,
}: SettingsDashboardDemoProps) {
  const handleDeliveryModeChange = (nextMode: string) => {
    if (isDeliveryMode(nextMode)) {
      onDeliveryModeChange(nextMode);
    }
  };

  return (
    <>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.9fr)]">
        <Card>
          <CardHeader className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge>
                <IconSparkles data-icon="inline-start" />
                Mira preset
              </Badge>
              {THEME_BADGES.map((themeBadge) => (
                <Badge key={themeBadge} variant="outline">
                  {themeBadge}
                </Badge>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <CardTitle id="settings-dashboard-title">
                Overlay settings lab
              </CardTitle>
              <CardDescription>
                A pragmatic dashboard that slides over the current page instead
                of replacing it, while still showcasing the current dark shadcn
                theme.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Card size="sm" className="h-full">
                <CardContent className="flex h-full flex-col gap-1">
                  <span className="text-muted-foreground">Theme</span>
                  <span className="font-medium">Dark</span>
                </CardContent>
              </Card>

              <Card size="sm" className="h-full">
                <CardContent className="flex h-full flex-col gap-1">
                  <span className="text-muted-foreground">Delivery mode</span>
                  <span className="font-medium">
                    {selectedDeliveryMode.label}
                  </span>
                </CardContent>
              </Card>

              <Card size="sm" className="h-full">
                <CardContent className="flex h-full flex-col gap-1">
                  <span className="text-muted-foreground">Asset toggles</span>
                  <span className="font-medium">{activeAssetCount} active</span>
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button type="button">
                <IconBrowserCheck data-icon="inline-start" />
                Primary action
              </Button>
              <Button type="button" variant="secondary">
                <IconAdjustmentsHorizontal data-icon="inline-start" />
                Secondary action
              </Button>
              <Button type="button" variant="outline">
                Outline action
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {CHART_SWATCHES.map((swatch) => (
                <Badge key={swatch.label} variant="outline" className="gap-2">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ backgroundColor: `var(${swatch.variable})` }}
                  />
                  {swatch.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance controls</CardTitle>
            <CardDescription>
              This build stays on the fixed dark theme. Adjust typography scale
              without leaving the dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <FieldSet>
              <FieldLegend variant="label">Theme</FieldLegend>
              <FieldHint>
                The preview uses the current dark theme as the default and only
                available look-and-feel.
              </FieldHint>

              <Badge variant="secondary" className="w-fit capitalize">
                Dark mode
              </Badge>
            </FieldSet>

            <Separator />

            <FieldSet>
              <FieldLegend variant="label">Typography scale</FieldLegend>
              <FieldHint>
                The HTML font size slider uses the shared shadcn toggle group
                beneath the custom control shell.
              </FieldHint>
              <HtmlFontSizeSlider />
            </FieldSet>
          </CardContent>
        </Card>
      </section>

      <Tabs defaultValue="appearance" className="w-full gap-4">
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto"
        >
          <TabsTrigger value="appearance">
            <IconPalette />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="content">
            <IconTypography />
            Content
          </TabsTrigger>
          <TabsTrigger value="assets">
            <IconLayoutGrid />
            Assets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="flex flex-col gap-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Preset snapshot</CardTitle>
                <CardDescription>
                  A compact readout of the current style tokens and what they
                  mean for this dashboard.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card size="sm">
                    <CardContent className="flex flex-col gap-1">
                      <span className="text-muted-foreground">
                        Style family
                      </span>
                      <span className="font-medium">Radix Mira</span>
                    </CardContent>
                  </Card>

                  <Card size="sm">
                    <CardContent className="flex flex-col gap-1">
                      <span className="text-muted-foreground">
                        Primary tone
                      </span>
                      <span className="font-medium">Purple</span>
                    </CardContent>
                  </Card>

                  <Card size="sm">
                    <CardContent className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Chart ramp</span>
                      <span className="font-medium">Lime</span>
                    </CardContent>
                  </Card>

                  <Card size="sm">
                    <CardContent className="flex flex-col gap-1">
                      <span className="text-muted-foreground">
                        Icon library
                      </span>
                      <span className="font-medium">Tabler</span>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <span className="text-muted-foreground">
                    The chart tokens surface the lime accent family while cards
                    and form controls stay grounded in the neutral Mira base.
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {CHART_SWATCHES.map((swatch) => (
                      <Badge
                        key={`appearance-${swatch.label}`}
                        variant="secondary"
                        className="gap-2"
                      >
                        <span
                          aria-hidden="true"
                          className="size-2 rounded-full"
                          style={{ backgroundColor: `var(${swatch.variable})` }}
                        />
                        {swatch.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Action states</CardTitle>
                <CardDescription>
                  Button, badge, and label treatments shown against the fixed
                  dark theme for quick visual review.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>
                    <IconSparkles data-icon="inline-start" />
                    Verified preset
                  </Badge>
                  <Badge variant="secondary">Dark preset</Badge>
                  <Badge variant="outline">Operator ready</Badge>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  <Button type="button">Default</Button>
                  <Button type="button" variant="secondary">
                    Secondary
                  </Button>
                  <Button type="button" variant="outline">
                    Outline
                  </Button>
                  <Button type="button" variant="ghost">
                    Ghost
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onResetDraft}
                  >
                    Reset draft
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onUndo}
                    disabled={!canUndo}
                  >
                    Undo last change
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="flex flex-col gap-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Overlay copy</CardTitle>
                <CardDescription>
                  Shadcn field, input, and textarea primitives wired into a
                  realistic draft surface.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <FieldSet>
                  <FieldLegend variant="label">Draft settings</FieldLegend>
                  <FieldHint>
                    Adjust the operator-facing copy and see it reflected in the
                    current page preview.
                  </FieldHint>

                  <FieldGroup className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="display-name">
                        Display name
                      </FieldLabel>
                      <Input
                        id="display-name"
                        value={displayName}
                        onChange={(event) =>
                          onDisplayNameChange(event.currentTarget.value)
                        }
                        placeholder="Studio overlay"
                      />
                      <FieldHint>
                        Used in compact status cards and handoff summaries.
                      </FieldHint>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="overlay-title">
                        Overlay title
                      </FieldLabel>
                      <Input
                        id="overlay-title"
                        value={overlayTitle}
                        onChange={(event) =>
                          onOverlayTitleChange(event.currentTarget.value)
                        }
                        placeholder="NEXIS live status"
                      />
                      <FieldHint>
                        The main title for the active overlay scene.
                      </FieldHint>
                    </Field>

                    <Field className="md:col-span-2">
                      <FieldLabel htmlFor="overlay-notes">
                        Operator notes
                      </FieldLabel>
                      <Textarea
                        id="overlay-notes"
                        value={notes}
                        onChange={(event) =>
                          onNotesChange(event.currentTarget.value)
                        }
                        placeholder="Summarize what this screen is demonstrating."
                        className="min-h-28"
                      />
                      <FieldHint>
                        Keep this concise enough for a status sidebar, but rich
                        enough to show the textarea states.
                      </FieldHint>
                    </Field>
                  </FieldGroup>
                </FieldSet>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery mode</CardTitle>
                <CardDescription>
                  The radio set drives the live page summary behind the
                  dashboard.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <FieldSet>
                  <FieldLegend variant="label">Preview channel</FieldLegend>
                  <FieldHint>
                    Choose how this dashboard should frame the current preview.
                  </FieldHint>

                  <RadioGroup
                    value={deliveryMode}
                    onValueChange={handleDeliveryModeChange}
                  >
                    {DELIVERY_OPTIONS.map((option) => {
                      const DeliveryIcon = option.icon;

                      return (
                        <Field key={option.value} orientation="horizontal">
                          <FieldContent>
                            <FieldLabel htmlFor={option.id} className="gap-2">
                              <DeliveryIcon />
                              {option.label}
                            </FieldLabel>
                            <FieldHint>{option.description}</FieldHint>
                          </FieldContent>
                          <RadioGroupItem value={option.value} id={option.id} />
                        </Field>
                      );
                    })}
                  </RadioGroup>
                </FieldSet>
              </CardContent>

              <CardFooter className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={onResetDraft}>
                  Reset draft
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="flex flex-col gap-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Protected checkbox assets</CardTitle>
                <CardDescription>
                  These stay custom on purpose. The surrounding layout is
                  shadcn, but the switches themselves remain your high-value
                  components.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <FieldSet>
                  <FieldLegend variant="label">Asset toggles</FieldLegend>
                  <FieldHint>
                    Keep these visible as signature controls alongside the new
                    dashboard surface.
                  </FieldHint>

                  <FieldGroup className="gap-3">
                    {ASSET_OPTIONS.map((option) => (
                      <Checkbox
                        key={option.key}
                        fieldcode={option.fieldcode}
                        label={option.label}
                        checked={assetToggles[option.key]}
                        onChange={(checked) =>
                          onAssetToggleChange(option.key, checked)
                        }
                      />
                    ))}
                  </FieldGroup>
                </FieldSet>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Live review</CardTitle>
                <CardDescription>
                  A compact summary card that reflects the current draft, fixed
                  dark theme, and preserved asset state.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Card size="sm">
                    <CardContent className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Theme</span>
                      <span className="font-medium">Dark</span>
                    </CardContent>
                  </Card>

                  <Card size="sm">
                    <CardContent className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Channel</span>
                      <span className="font-medium">
                        {selectedDeliveryMode.label}
                      </span>
                    </CardContent>
                  </Card>

                  <Card size="sm">
                    <CardContent className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Checkboxes</span>
                      <span className="font-medium">
                        {activeAssetCount} active
                      </span>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <span className="text-muted-foreground">Display name</span>
                  <span className="font-medium">{displayName}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-muted-foreground">Overlay title</span>
                  <span className="font-medium">{overlayTitle}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-muted-foreground">Operator notes</span>
                  <p>{notes}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
