"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Chart } from "@/components/chart";
import { ColumnList, DataGrid } from "@/components/data-grid";
import {
  AlertIcon,
  ChartIcon,
  CheckIcon,
  ChevronIcon,
  CodeIcon,
  CopyIcon,
  FileIcon,
  QueryIcon,
  SendIcon,
  StatsIcon,
  TableIcon,
  UploadIcon,
} from "@/components/icons";
import type { Dataset, Message, Step } from "@/lib/types";

type Assistant = Extract<Message, { role: "assistant" }>;
type Tab = "dataset" | "result" | "sql" | "chart";
type Sel = { msg: number; step: number };

const tabFor = (s: Step): Tab => (s.tool === "show_chart" ? "chart" : "result");

const TOOL = {
  run_sql: { label: "Query", Icon: QueryIcon },
  column_stats: { label: "Column check", Icon: StatsIcon },
  show_chart: { label: "Chart", Icon: ChartIcon },
} as const;

export function Chat({ ds }: { ds: Dataset }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sel, setSel] = useState<Sel | null>(null);
  const [tab, setTab] = useState<Tab>("dataset");
  const [sheetOpen, setSheetOpen] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const last = messages.at(-1);
  const busy = last?.role === "assistant" && !!last.pending;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function select(msg: number, step: number, s: Step, to?: Tab) {
    setSel({ msg, step });
    setTab((t) => to ?? (t === "sql" && s.tool === "run_sql" ? "sql" : tabFor(s)));
    // On narrow screens the workbench is a sheet, so open it.
    if (window.matchMedia("(max-width: 1023px)").matches) setSheetOpen(true);
  }

  function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    // TODO: POST to the chat route and append steps/text from the SSE stream; select each new step.
    setMessages((ms) => [
      ...ms,
      { role: "user", content: q },
      { role: "assistant", content: "", steps: [], error: "The agent isn't connected yet." },
    ]);
  }

  // Tabs belong to the answer, not the step: Result/SQL show the selected query (or, on the
  // chart step, the query the chart was built from) and Chart shows the answer's chart.
  const steps = (sel && (messages[sel.msg] as Assistant | undefined)?.steps) || [];
  const chartIdx = steps.findIndex((s) => s.tool === "show_chart");
  const chartStep = steps[chartIdx];
  const chart = chartStep?.tool === "show_chart" ? chartStep.chart : undefined;
  const dataIdx =
    sel && steps[sel.step]?.tool === "show_chart"
      ? steps.findLastIndex((s, i) => i < sel.step && s.tool === "run_sql" && !s.error)
      : (sel?.step ?? -1);
  const dataStep = steps[dataIdx];
  const tabs: [Tab, string][] = [["dataset", "Dataset"]];
  if (dataStep) tabs.push(["result", "Result"]);
  if (dataStep?.tool === "run_sql") tabs.push(["sql", "SQL"]);
  if (chart) tabs.push(["chart", "Chart"]);
  const active = tabs.some(([k]) => k === tab) ? tab : "dataset";

  function openTab(key: Tab) {
    setTab(key);
    // Keep the highlighted step in the timeline in sync with what the pane shows.
    if (!sel) return;
    if (key === "chart") setSel({ msg: sel.msg, step: chartIdx });
    if (key === "result" || key === "sql") setSel({ msg: sel.msg, step: dataIdx });
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-5">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-accent font-mono text-sm text-surface">∑</span>
          <span className="hidden sm:inline">Analyst</span>
        </Link>
        <span className="text-line">/</span>
        <h1 className="truncate font-medium">{ds.fileName}</h1>
        <span className="hidden shrink-0 rounded-full bg-subtle px-2.5 py-0.5 text-xs text-muted sm:inline">
          {ds.rowCount.toLocaleString()} rows · {ds.columns.length} columns
        </span>
        <Link
          href="/"
          className="ml-auto flex shrink-0 items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-subtle"
        >
          <UploadIcon className="size-4" />
          <span className="hidden sm:inline">New dataset</span>
        </Link>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Conversation */}
        <section className="flex w-full min-w-0 flex-col bg-bg lg:w-[27rem] lg:shrink-0 lg:border-r lg:border-line">
          <div className="flex-1 overflow-y-auto px-5 py-6">
            {messages.length === 0 ? (
              <Welcome ds={ds} />
            ) : (
              <div className="space-y-4">
                {messages.map((m, i) =>
                  m.role === "user" ? (
                    <div key={i} className="flex justify-end pt-6 first:pt-0">
                      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-surface px-4 py-2.5 shadow-xs ring-1 ring-line">
                        {m.content}
                      </p>
                    </div>
                  ) : (
                    <Answer
                      key={i}
                      m={m}
                      selected={sel?.msg === i ? sel.step : null}
                      onSelect={(j, to) => select(i, j, m.steps[j], to)}
                    />
                  ),
                )}
              </div>
            )}
            <div ref={bottom} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="shrink-0 px-5 pb-4"
          >
            <div className="flex items-end gap-2 rounded-xl border border-line bg-surface p-2 shadow-sm focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/15">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask(input);
                  }
                }}
                rows={1}
                placeholder="Ask a question about this data"
                aria-label="Question"
                className="field-sizing-content max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 outline-none placeholder:text-muted"
              />
              <button
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-surface transition-opacity hover:opacity-90 disabled:bg-subtle disabled:text-muted"
              >
                <SendIcon className="size-4" />
              </button>
            </div>
            <p className="mt-2 hidden text-center text-xs text-muted sm:block">Enter to send · Shift + Enter for a new line</p>
          </form>
        </section>

        {/* Workbench: a side pane on desktop, a full-screen sheet on mobile. */}
        <section className={`min-w-0 flex-1 flex-col bg-surface ${sheetOpen ? "fixed inset-0 z-30 flex" : "hidden lg:flex"}`}>
          <nav className="flex h-12 shrink-0 items-end gap-6 border-b border-line px-6" aria-label="Workbench">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                onClick={() => openTab(key)}
                aria-current={active === key ? "page" : undefined}
                className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
                  active === key ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setSheetOpen(false)}
              className="mb-2.5 ml-auto rounded-lg border border-line px-3 py-1 text-sm lg:hidden"
            >
              Close
            </button>
          </nav>

          <div className="flex min-h-0 flex-1 flex-col">
            {active === "chart" && chartStep && chart ? (
              <>
                <StepHeader n={chartIdx + 1} step={chartStep} />
                <Chart chart={chart} />
              </>
            ) : active !== "dataset" && dataStep ? (
              <>
                <StepHeader n={dataIdx + 1} step={dataStep} />
                <Bench tab={active} step={dataStep} />
              </>
            ) : (
              <DatasetView ds={ds} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Welcome({ ds }: { ds: Dataset }) {
  const flagged = ds.columns.filter((c) => c.note);
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
          <FileIcon className="size-5" />
        </span>
        <div>
          <p className="font-semibold">{ds.fileName}</p>
          <p className="text-sm text-muted">
            {ds.rowCount.toLocaleString()} rows · {ds.columns.length} columns
          </p>
        </div>
      </div>

      {flagged.length > 0 && (
        <div className="mt-4 flex gap-2.5 rounded-lg bg-warn-soft px-3 py-2.5 text-sm text-warn">
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            {flagged.map((c) => (
              <span key={c.name}>
                <span className="font-mono font-medium">{c.name}</span> is stored as text ({c.note}).{" "}
              </span>
            ))}
            The agent will cast it when needed.
          </p>
        </div>
      )}
    </div>
  );
}

function Answer({
  m,
  selected,
  onSelect,
}: {
  m: Assistant;
  selected: number | null;
  onSelect: (step: number, tab?: Tab) => void;
}) {
  const [open, setOpen] = useState(false);
  const showSteps = m.pending || open;
  const retries = m.steps.filter((s) => s.tool === "run_sql" && s.error).length;
  const chartStep = m.steps.findIndex((s) => s.tool === "show_chart");
  const lastQuery = m.steps.findLastIndex((s) => s.tool === "run_sql" && !s.error);

  return (
    <div className="space-y-4">
      {m.steps.length > 0 && (
        <div>
          {!m.pending && (
            <button
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              className="flex items-center gap-1.5 text-[13px] text-muted hover:text-fg"
            >
              <ChevronIcon className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
              How I got this · {m.steps.length} {m.steps.length === 1 ? "step" : "steps"}
              {retries > 0 && ` · ${retries} ${retries === 1 ? "retry" : "retries"}`}
            </button>
          )}
          {showSteps && (
            <ol className={m.pending ? "" : "mt-3"}>
              {m.steps.map((s, j) => {
                const failed = s.tool === "run_sql" && !!s.error;
                const { label, Icon } = TOOL[s.tool];
                return (
                  <li key={j} className="relative pb-4 pl-8">
                    {(j < m.steps.length - 1 || m.pending) && <span className="absolute top-6 bottom-0 left-[11px] w-px bg-line" />}
                    <span
                      className={`absolute top-0 left-0 grid size-6 place-items-center rounded-md ${
                        failed ? "bg-danger-soft text-danger" : "bg-accent-soft text-accent"
                      }`}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <button
                      onClick={() => onSelect(j)}
                      aria-pressed={selected === j}
                      className="group block w-full text-left text-[13px] leading-snug"
                    >
                      <span className="flex items-baseline gap-2">
                        <span className={`font-medium group-hover:underline ${selected === j ? "text-accent" : ""}`}>{label}</span>
                        <span className={failed ? "text-danger" : "text-muted"}>{meta(s)}</span>
                      </span>
                      <span className="mt-0.5 block text-muted">{s.reason}</span>
                    </button>
                  </li>
                );
              })}
              {m.pending && !m.content && (
                <li className="relative flex h-6 items-center pl-8 text-[13px] text-muted">
                  <span className="absolute left-[5px] size-3.5 animate-spin rounded-full border-2 border-line border-t-accent" />
                  Working…
                </li>
              )}
            </ol>
          )}
        </div>
      )}

      {m.pending && !m.content && m.steps.length === 0 && (
        <p className="flex items-center gap-2.5 text-[13px] text-muted">
          <span className="size-3.5 animate-spin rounded-full border-2 border-line border-t-accent" />
          Reading the schema…
        </p>
      )}

      {m.content && (
        <div>
          {/* TODO: swap for the markdown renderer from Khoj. */}
          <p className="leading-7 whitespace-pre-wrap">{m.content}</p>
          {!m.pending && (chartStep >= 0 || lastQuery >= 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {chartStep >= 0 && <ViewLink icon={<ChartIcon className="size-3.5" />} label="Chart" onClick={() => onSelect(chartStep, "chart")} />}
              {lastQuery >= 0 && <ViewLink icon={<TableIcon className="size-3.5" />} label="Result" onClick={() => onSelect(lastQuery, "result")} />}
              {lastQuery >= 0 && <ViewLink icon={<CodeIcon className="size-3.5" />} label="SQL" onClick={() => onSelect(lastQuery, "sql")} />}
            </div>
          )}
        </div>
      )}

      {m.error && (
        <p role="alert" className="flex gap-2.5 rounded-xl bg-danger-soft px-4 py-3 text-danger">
          <AlertIcon className="mt-1 size-4 shrink-0" />
          {m.error}
        </p>
      )}
    </div>
  );
}

function ViewLink({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-[13px] font-medium hover:border-accent hover:text-accent"
    >
      {icon}
      {label}
    </button>
  );
}

function meta(s: Step) {
  if (s.tool === "run_sql") return s.error ? "Failed" : `${s.rowCount} rows · ${s.ms} ms`;
  if (s.tool === "column_stats") return s.column;
  return s.chart.type === "bar" ? "Bar" : "Line";
}

function StepHeader({ n, step }: { n: number; step: Step }) {
  const failed = step.tool === "run_sql" && !!step.error;
  return (
    <div className="shrink-0 border-b border-line px-6 py-4">
      <p className="text-xs font-medium text-muted">
        Step {n} · {TOOL[step.tool].label}
        {failed && <span className="text-danger"> · failed</span>}
      </p>
      <p className="mt-1 text-[15px]">{step.reason}</p>
    </div>
  );
}

function Bench({ tab, step }: { tab: Tab; step: Step }) {
  if (tab === "sql" && step.tool === "run_sql") return <SqlView sql={step.sql} />;

  if (step.tool === "run_sql") {
    return step.error ? (
      <div className="px-6 py-5">
        <p className="rounded-lg bg-danger-soft px-4 py-3 font-mono text-[13px] text-danger">{step.error}</p>
        <p className="mt-3 max-w-prose text-sm text-muted">
          This error went back to the model as the tool result, so it could fix the query. The next step shows the
          retry.
        </p>
      </div>
    ) : (
      <DataGrid rows={step.rows ?? []} bars />
    );
  }

  if (step.tool === "column_stats") {
    return (
      <div className="px-6 py-5">
        <p className="mb-3 font-mono text-sm">{step.column}</p>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(step.stats).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line px-4 py-3">
              <dt className="text-xs text-muted">{k.replace(/_/g, " ")}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{typeof v === "number" ? v.toLocaleString() : v}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }
  return null;
}

function DatasetView({ ds }: { ds: Dataset }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <section className="px-6 pt-5 pb-6">
        <h3 className="mb-1 font-semibold">Columns</h3>
        <p className="mb-3 text-sm text-muted">What the agent sees, including types inferred from your file.</p>
        <div className="max-w-2xl">
          <ColumnList columns={ds.columns} />
        </div>
      </section>
      <section className="border-t border-line pt-5">
        <h3 className="mb-3 px-6 font-semibold">Sample rows</h3>
        <DataGrid rows={ds.sample} />
        <p className="px-6 py-3 text-xs text-muted">
          First {ds.sample.length} of {ds.rowCount.toLocaleString()} rows
        </p>
      </section>
    </div>
  );
}

const KEYWORDS =
  /\b(select|from|where|group by|order by|having|limit|with|as|and|or|not|in|is|null|join|left|inner|on|desc|asc|case|when|then|else|end|distinct)\b/i;

function SqlView({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
      <div className="relative rounded-xl bg-subtle">
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(sql);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-md bg-surface px-2 py-1 text-xs font-medium shadow-xs hover:text-accent"
        >
          {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <pre className="overflow-x-auto py-4 pr-20 font-mono text-[13px] leading-6">
          {sql.split("\n").map((line, i) => (
            <div key={i} className="flex">
              <span className="w-10 shrink-0 pr-4 text-right text-muted select-none">{i + 1}</span>
              <code>
                {/* split() with a capture group keeps the keywords at odd indexes. */}
                {line.split(new RegExp(KEYWORDS.source, "gi")).map((p, j) =>
                  j % 2 ? (
                    <span key={j} className="font-medium text-accent">
                      {p}
                    </span>
                  ) : (
                    p
                  ),
                )}
              </code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
