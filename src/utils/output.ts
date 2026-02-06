import type { OutputHints } from "./hints";

export type OutputFormat = "json" | "plain";

export interface OutputPayload<T> {
  data: T;
  pagination?: Record<string, unknown>;
  hints?: OutputHints;
}

export function printOutput<T>(
  format: OutputFormat,
  payload: OutputPayload<T>,
): void {
  if (format === "json") {
    const out = {
      data: payload.data,
      pagination: payload.pagination ?? null,
      _hints: payload.hints ?? null,
    };
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  const dataJson = JSON.stringify(payload.data, null, 2);
  console.log(dataJson);
  if (payload.pagination) {
    console.log("\nPagination:");
    console.log(JSON.stringify(payload.pagination, null, 2));
  }
  if (payload.hints) {
    console.log("\nHints:");
    console.log(renderHints(payload.hints));
  }
}

function renderHints(hints: OutputHints): string {
  const lines: string[] = [];
  if (hints.available_filters?.length) {
    lines.push(`Filters: ${hints.available_filters.join(", ")}`);
  }
  if (hints.next) lines.push(`Next: ${hints.next}`);
  if (hints.related?.length) {
    lines.push(`Related: ${hints.related.join(", ")}`);
  }
  if (hints.notes?.length) {
    lines.push(`Notes: ${hints.notes.join(" | ")}`);
  }
  return lines.join("\n");
}
