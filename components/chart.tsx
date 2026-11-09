"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartSpec } from "@/lib/types";

// Fixed categorical order; color follows the series index, never its rank.
const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)"];

const fmt = (v: unknown) => (typeof v === "number" ? v.toLocaleString() : String(v));

export function Chart({ chart }: { chart: ChartSpec }) {
  const y = chart.y.slice(0, SERIES.length);
  const axis = { stroke: "var(--line)", tick: { fill: "var(--muted)", fontSize: 12 }, tickLine: false };
  const props = { data: chart.rows, margin: { top: 8, right: 12, bottom: 0, left: 0 } };
  const parts = [
    <CartesianGrid key="g" vertical={false} stroke="var(--line)" />,
    <XAxis key="x" dataKey={chart.x} {...axis} />,
    <YAxis key="y" {...axis} axisLine={false} width={56} tickFormatter={fmt} />,
    <Tooltip
      key="t"
      formatter={fmt}
      cursor={chart.type === "bar" ? { fill: "var(--subtle)" } : { stroke: "var(--muted)" }}
      contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13 }}
      labelStyle={{ color: "var(--fg)" }}
    />,
    y.length > 1 && <Legend key="l" wrapperStyle={{ fontSize: 12 }} />,
  ];

  return (
    <figure className="flex min-h-72 flex-1 flex-col px-6 py-5">
      <figcaption className="mb-4 text-base font-semibold">{chart.title}</figcaption>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer>
          {chart.type === "bar" ? (
            <BarChart {...props} barCategoryGap="25%">
              {parts}
              {y.map((key, i) => (
                <Bar key={key} dataKey={key} fill={SERIES[i]} radius={[4, 4, 0, 0]} maxBarSize={56} />
              ))}
            </BarChart>
          ) : (
            <LineChart {...props}>
              {parts}
              {y.map((key, i) => (
                <Line key={key} dataKey={key} stroke={SERIES[i]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
