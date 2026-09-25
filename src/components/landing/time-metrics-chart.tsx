"use client";

import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function TimeMetricsChart() {
  const t = useTranslations("landing.chart");

  const chartData = [
    { action: t("testing"), paper: 30, prisma: 10 },
    { action: t("processing"), paper: 15, prisma: 1 },
  ];

  const chartConfig = {
    paper: {
      label: t("paper"),
      color: "hsl(105, 57%, 61%)",
    },
    prisma: {
      label: t("prisma"),
      color: "hsl(105, 41%, 37%)",
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("unit")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="action"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="paper" fill="var(--color-paper)" radius={10} />
            <Bar dataKey="prisma" fill="var(--color-prisma)" radius={10} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
