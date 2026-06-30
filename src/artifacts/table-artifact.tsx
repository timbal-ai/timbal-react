"use client";

import { type FC } from "react";
import type { TableArtifact } from "./types";
import { ArtifactCard } from "./artifact-card";

export const TableArtifactView: FC<{ artifact: TableArtifact }> = ({ artifact }) => {
  const rows = artifact.rows ?? [];
  const columns = artifact.columns ?? deriveColumns(rows);

  return (
    <ArtifactCard title={artifact.title} kind="table">
      <div className="aui-artifact-table-wrap overflow-x-auto">
        <table className="aui-artifact-table w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground"
                >
                  {col.label ?? col.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border/30 transition-colors last:border-b-0 hover:bg-muted/20"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-3 py-2 align-top text-foreground/85"
                  >
                    {formatCell(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ArtifactCard>
  );
};

function deriveColumns(
  rows: Array<Record<string, unknown>>,
): NonNullable<TableArtifact["columns"]> {
  const seen = new Set<string>();
  const cols: NonNullable<TableArtifact["columns"]> = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        cols.push({ key });
      }
    }
  }
  return cols;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
