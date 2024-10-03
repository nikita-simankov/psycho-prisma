"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { action: "Время на тестирование", paper: 30, prisma: 10 },
  { action: "Обработка результатов", paper: 15, prisma: 1 },
];

const chartConfig = {
  paper: {
    label: "Бумажный носитель",
    color: "hsl(105, 57%, 61%)",
  },
  prisma: {
    label: "Призма",
    color: "hsl(105, 41%, 37%)",
  },
} satisfies ChartConfig;

export function TimeMetricsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Затраты по времени</CardTitle>
        <CardDescription>Данные указаны в минутах</CardDescription>
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
