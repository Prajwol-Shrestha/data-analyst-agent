export type Cell = string | number | null;
export type Row = Record<string, Cell>;

export type Column = {
  name: string;
  original: string;
  type: "integer" | "numeric" | "date" | "boolean" | "text";
  note?: string;
};

export type Dataset = {
  id: string;
  fileName: string;
  rowCount: number;
  columns: Column[];
  sample: Row[];
  cleaning: string[];
};

export type ChartSpec = {
  type: "bar" | "line";
  title: string;
  x: string;
  y: string[];
  rows: Row[];
};

export type Step =
  | {
      tool: "run_sql";
      reason: string;
      sql: string;
      rows?: Row[];
      rowCount?: number;
      ms?: number;
      error?: string;
    }
  | { tool: "column_stats"; reason: string; column: string; stats: Row }
  | { tool: "show_chart"; reason: string; chart: ChartSpec };

export type Message =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      steps: Step[];
      chart?: ChartSpec;
      error?: string;
      pending?: boolean;
    };

