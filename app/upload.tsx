"use client";

import Link from "next/link";
import { useState } from "react";
import { ColumnList, DataGrid } from "@/components/data-grid";
import { AlertIcon, ArrowIcon, CheckIcon, FileIcon, UploadIcon } from "@/components/icons";
import type { Dataset } from "@/lib/types";

type State =
  | { status: "idle" }
  | { status: "loading"; name: string }
  | { status: "ready"; ds: Dataset }
  | { status: "error"; message: string };

export function Upload() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [dragging, setDragging] = useState(false);

  function pick(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setState({ status: "error", message: `${file.name} isn't a CSV file. Export it as .csv and try again.` });
      return;
    }
    setState({ status: "loading", name: file.name });
    // TODO: POST to the upload route, then setState({ status: "ready", ds }).
    setState({ status: "error", message: "Uploads aren't connected yet." });
  }

  if (state.status === "ready") return <Preview ds={state.ds} onReset={() => setState({ status: "idle" })} />;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-[28px] leading-tight font-semibold tracking-tight">Ask questions about your data</h1>
      <p className="mt-2 text-muted">
        Upload a CSV and ask in plain language. You get an answer, plus the SQL and results behind it.
      </p>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files[0]);
        }}
        className={`mt-8 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors has-focus-visible:border-accent has-focus-visible:ring-4 has-focus-visible:ring-accent/15 ${
          dragging ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-accent/50"
        }`}
      >
        <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        <span className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent">
          {state.status === "loading" ? (
            <span className="size-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          ) : (
            <UploadIcon className="size-5" />
          )}
        </span>
        {state.status === "loading" ? (
          <span className="mt-4 font-medium">Reading {state.name}…</span>
        ) : (
          <>
            <span className="mt-4 font-medium">
              Drop a CSV file here, or <span className="text-accent">browse</span>
            </span>
            <span className="mt-1 text-sm text-muted">One table per file</span>
          </>
        )}
      </label>

      {state.status === "error" && (
        <p role="alert" className="mt-3 flex gap-2.5 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      )}

      <div className="mt-10 grid gap-6 text-sm sm:grid-cols-2">
        <div>
          <p className="font-medium">Cleaned up for you</p>
          <p className="mt-1 text-muted">Title rows, $ and % signs, thousand separators, and blanks like N/A.</p>
        </div>
        <div>
          <p className="font-medium">Not supported yet</p>
          <p className="mt-1 text-muted">Excel files, merged cells, multi-row headers, or several tables in one sheet.</p>
        </div>
      </div>
    </div>
  );
}

function Preview({ ds, onReset }: { ds: Dataset; onReset: () => void }) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
          <FileIcon className="size-5" />
        </span>
        <div className="mr-auto">
          <h1 className="text-xl font-semibold tracking-tight">{ds.fileName}</h1>
          <p className="text-sm text-muted">
            {ds.rowCount.toLocaleString()} rows · {ds.columns.length} columns · ready to query
          </p>
        </div>
        <button onClick={onReset} className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium hover:bg-subtle">
          Use a different file
        </button>
        <Link
          href={`/d/${ds.id}`}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface hover:opacity-90"
        >
          Start asking
          <ArrowIcon className="size-4" />
        </Link>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-2xl border border-line bg-surface px-5 py-4">
          <h2 className="font-semibold">Columns</h2>
          <p className="mb-2 text-sm text-muted">Names are cleaned up for SQL; your original header is in quotes.</p>
          <ColumnList columns={ds.columns} />
        </section>

        <section className="rounded-2xl border border-line bg-surface px-5 py-4">
          <h2 className="mb-3 font-semibold">What we cleaned</h2>
          <ul className="space-y-3 text-sm">
            {ds.cleaning.map((c) => (
              <li key={c} className="flex gap-2.5">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface">
        <h2 className="px-6 pt-4 pb-3 font-semibold">Sample rows</h2>
        <DataGrid rows={ds.sample} />
        <p className="px-6 py-3 text-xs text-muted">
          First {ds.sample.length} of {ds.rowCount.toLocaleString()} rows
        </p>
      </section>
    </div>
  );
}
