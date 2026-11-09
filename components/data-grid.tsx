import type { Column, Row } from "@/lib/types";

const UI_ROW_CAP = 100;

// IDs and codes shouldn't get thousand separators ("1,001").
const isId = (col: string) => /(^|_)(id|no|code|zip)$/i.test(col);

export function DataGrid({ rows, bars = false }: { rows: Row[]; bars?: boolean }) {
  if (rows.length === 0) return <p className="px-6 py-8 text-muted">The query returned no rows.</p>;
  const cols = Object.keys(rows[0]);
  const shown = rows.slice(0, UI_ROW_CAP);
  // Numeric columns are right-aligned; with bars, each is scaled to its own max.
  const max: Record<string, number> = {};
  for (const c of cols) {
    const nums = shown.map((r) => r[c]).filter((v): v is number => typeof v === "number");
    if (nums.length === shown.length) max[c] = Math.max(...nums.map(Math.abs));
  }

  return (
    <div className="min-h-0 overflow-auto">
      <table className="w-full border-separate border-spacing-0 text-[13px] tabular-nums">
        <thead className="sticky top-0 z-10 bg-surface">
          <tr>
            <th className="w-12 border-b border-line py-2.5 pr-3 pl-6 text-right font-medium text-muted">#</th>
            {cols.map((c) => (
              <th
                key={c}
                className={`border-b border-line px-4 py-2.5 font-mono text-xs font-medium whitespace-nowrap text-muted last:pr-6 ${c in max ? "text-right" : "text-left"}`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((row, i) => (
            <tr key={i} className="hover:bg-subtle/60">
              <td className="border-b border-line py-2.5 pr-3 pl-6 text-right text-xs text-muted">{i + 1}</td>
              {cols.map((c) => {
                const v = row[c];
                const pct = bars && c in max && max[c] > 0 ? (Math.abs(v as number) / max[c]) * 100 : 0;
                return (
                  <td
                    key={c}
                    title={v === null ? undefined : String(v)}
                    className={`max-w-72 truncate border-b border-line px-4 py-2.5 last:pr-6 ${c in max ? "text-right" : ""}`}
                  >
                    {pct > 0 && (
                      <span className="mr-3 inline-block h-1.5 w-20 rounded-full bg-subtle align-middle">
                        <span className="block h-full rounded-full bg-accent/70" style={{ width: `${pct}%` }} />
                      </span>
                    )}
                    {v === null ? <span className="text-muted/70 italic">empty</span> : typeof v === "number" && !isId(c) ? v.toLocaleString() : v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const typeStyle: Record<Column["type"], string> = {
  integer: "bg-t-num-soft text-t-num",
  numeric: "bg-t-num-soft text-t-num",
  date: "bg-t-date-soft text-t-date",
  boolean: "bg-warn-soft text-warn",
  text: "bg-subtle text-muted",
};

export function TypeTag({ type }: { type: Column["type"] }) {
  return <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-medium ${typeStyle[type]}`}>{type}</span>;
}

export function ColumnList({ columns }: { columns: Column[] }) {
  return (
    <ul className="divide-y divide-line">
      {columns.map((c) => (
        <li key={c.name} className="flex items-center gap-3 py-2.5">
          <span className="font-mono text-[13px]">{c.name}</span>
          {c.original !== c.name && <span className="truncate text-xs text-muted">“{c.original}”</span>}
          <span className="ml-auto flex shrink-0 items-center gap-2">
            {c.note && <span className="rounded bg-warn-soft px-1.5 py-0.5 text-[11px] font-medium text-warn">{c.note}</span>}
            <TypeTag type={c.type} />
          </span>
        </li>
      ))}
    </ul>
  );
}
