import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ensureUser } from "@/utils/authentication";
import { cn } from "@/utils/utils";
import type { Metadata } from "next";

// Internal design-system gallery: every token and base component, in the light and the dark theme side by side.
// Screenshot tests (e2e/design.spec.ts) compare it on every change, so the look can't drift by accident.
// Deliberately English-only: it is a tool for the people building the product, not a product page.

export const metadata: Metadata = { title: "Design system", robots: { index: false, follow: false } };

const SEMANTIC_COLORS = [
  ["background", "Page"],
  ["card", "Surface"],
  ["foreground", "Text"],
  ["muted-foreground", "Secondary text"],
  ["primary", "Action"],
  ["accent", "Selection"],
  ["secondary", "Quiet fill"],
  ["muted", "Sunken"],
  ["border", "Rule"],
  ["input", "Control edge"],
  ["success", "Valid"],
  ["warning", "Check"],
  ["destructive", "Critical"],
  ["sidebar", "Sidebar"],
] as const;

const SERIES = ["series-1", "series-2", "series-3"];
const SEQUENTIAL = ["seq-100", "seq-200", "seq-300", "seq-400", "seq-500", "seq-600", "seq-700"];
const RADII = ["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl"] as const;
const PROFILE = [
  { scale: "Warmth", value: 8 },
  { scale: "Emotional stability", value: 6 },
  { scale: "Dominance", value: 3 },
  { scale: "Rule-consciousness", value: 9 },
];

export default async function DesignPage() {
  await ensureUser();

  return (
    <main id="main" className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2 border-b border-foreground pb-6">
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">Calibre · design system</span>
        <h1 className="text-4xl font-medium sm:text-5xl">Tokens and components</h1>
        <p className="max-w-2xl text-muted-foreground">
          The same showcase in both themes. Components read semantic tokens only, so a change here is a change everywhere.
        </p>
      </header>
      <div className="grid gap-6 xl:grid-cols-2">
        <Showcase theme="light" />
        <Showcase theme="dark" />
      </div>
    </main>
  );
}

function Showcase({ theme }: { theme: "light" | "dark" }) {
  return (
    <section
      data-testid={`showcase-${theme}`}
      className={cn(theme, "flex flex-col gap-10 rounded-lg border bg-background p-6 text-foreground")}
    >
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">{theme} theme</p>

      <Group title="Typography">
        <div className="flex flex-col divide-y">
          <Specimen token="display · Literata 48">
            <span className="font-heading text-5xl font-medium leading-none">Team profile</span>
          </Specimen>
          <Specimen token="title · Literata 28">
            <span className="font-heading text-[1.75rem] font-medium leading-tight">Эмоциональная устойчивость</span>
          </Specimen>
          <Specimen token="heading · Onest 18/600">
            <span className="text-lg font-semibold">Recent submissions</span>
          </Specimen>
          <Specimen token="body · Onest 15">
            <span className="text-[0.9375rem]">Results older than 12 months are removed automatically.</span>
          </Specimen>
          <Specimen token="data · JetBrains Mono">
            <span className="font-mono text-sm" data-numeric>
              sten 7 · T 62 · α = 0.84 · n = 37
            </span>
          </Specimen>
        </div>
      </Group>

      <Group title="Colour">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SEMANTIC_COLORS.map(([token, label]) => (
            <div key={token} className="flex items-center gap-3 rounded-md border bg-card p-2">
              <span className="size-9 shrink-0 rounded-sm border" style={{ background: `var(--${token === "sidebar" ? "sidebar-background" : token})` }} />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm">{label}</span>
                <code className="truncate font-mono text-[0.7rem] text-muted-foreground">{token}</code>
              </span>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Ramp label="Series: person · team · organization" tokens={SERIES} />
          <Ramp label="Sequential (heatmaps)" tokens={SEQUENTIAL} />
        </div>
      </Group>

      <Group title="Shape">
        <div className="flex flex-wrap gap-4">
          {RADII.map((radius) => (
            <div key={radius} className="flex flex-col items-center gap-2">
              <span className={cn(radius, "size-14 border-2 border-foreground/70 bg-card")} />
              <code className="font-mono text-[0.7rem] text-muted-foreground">{radius}</code>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2">
            <span className="flex h-row w-40 items-center border-y px-3 text-sm">Table row</span>
            <code className="font-mono text-[0.7rem] text-muted-foreground">h-row (density)</code>
          </div>
        </div>
      </Group>

      <Group title="Actions">
        <div className="flex flex-wrap gap-2">
          <Button>Send round</Button>
          <Button variant="secondary">Save draft</Button>
          <Button variant="outline">Compare</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">Erase</Button>
          <Button variant="link">View report</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Group>

      <Group title="Form controls">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${theme}-email`}>Work email</Label>
            <Input id={`${theme}-email`} placeholder="olga@acme.com" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${theme}-disabled`}>Organization</Label>
            <Input id={`${theme}-disabled`} value="Acme Ltd" disabled readOnly />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor={`${theme}-note`}>Note for the report</Label>
            <Textarea id={`${theme}-note`} placeholder="Discussed in the follow-up on 12 September." />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={`${theme}-consent`} defaultChecked />
            <Label htmlFor={`${theme}-consent`}>Show results to respondents</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id={`${theme}-retest`} defaultChecked />
            <Label htmlFor={`${theme}-retest`}>Repeat every 6 months</Label>
          </div>
        </div>
      </Group>

      <Group title="Status">
        <div className="flex flex-wrap gap-2">
          <Badge>Open</Badge>
          <Badge variant="secondary">Draft</Badge>
          <Badge variant="outline">v3</Badge>
          <Badge variant="destructive">Flagged</Badge>
        </div>
        <Progress value={31} max={48} label="31 of 48 done" />
        <Alert>
          <AlertTitle>Change since March</AlertTitle>
          <AlertDescription>Dominance moved by 3 sten, so it is flagged for follow-up.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Answers to check</AlertTitle>
          <AlertDescription>Two submissions were completed faster than the minimum reading time.</AlertDescription>
        </Alert>
      </Group>

      <Group title="Containers">
        <Card>
          <CardHeader>
            <CardTitle>Q3 engagement round</CardTitle>
            <CardDescription>Closes on 3 October · 48 people</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {PROFILE.map(({ scale, value }) => (
              <div key={scale} className="grid grid-cols-[9rem_1fr_2rem] items-center gap-3 text-sm">
                <span>{scale}</span>
                <span className="grid grid-cols-10 gap-0.5">
                  {Array.from({ length: 10 }, (_, index) => (
                    <span
                      key={index}
                      className={cn(
                        "h-4 border",
                        index + 1 === value ? "border-primary bg-primary" : index >= 3 && index <= 6 ? "bg-accent" : "bg-muted",
                      )}
                    />
                  ))}
                </span>
                <span className="text-right font-mono" data-numeric>
                  {value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Tabs defaultValue="people">
          <TabsList>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>
          <TabsContent value="people">
            <div className="overflow-x-auto rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Olga Petrova", "Product Design", "12 Sep 2026"],
                    ["Daniel Brooks", "Sales", "9 Sep 2026"],
                    ["Mira Novak", "Support", "2 Sep 2026"],
                  ].map(([name, team, date]) => (
                    <TableRow key={name}>
                      <TableCell>{name}</TableCell>
                      <TableCell className="text-muted-foreground">{team}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Group>
    </section>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="border-t border-foreground pt-3 text-xl font-medium">{title}</h2>
      {children}
    </div>
  );
}

function Specimen({ token, children }: { token: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:items-baseline sm:gap-4">
      <code className="font-mono text-[0.7rem] text-muted-foreground">{token}</code>
      {children}
    </div>
  );
}

function Ramp({ label, tokens }: { label: string; tokens: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex h-8 overflow-hidden rounded-sm border">
        {tokens.map((token) => (
          <span key={token} className="flex-1" style={{ background: `var(--${token})` }} title={token} />
        ))}
      </span>
    </div>
  );
}
