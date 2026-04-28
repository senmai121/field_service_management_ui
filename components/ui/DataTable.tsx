"use client";

import React from "react";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  const hasActions = !!(onEdit || onDelete);

  return (
    <div className="border border-slate-800 bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3.5">
                      <div className="h-3.5 animate-pulse rounded-sm bg-slate-800" />
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3.5">
                      <div className="ml-auto h-3.5 w-16 animate-pulse rounded-sm bg-slate-800" />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="px-4 py-16 text-center text-sm text-slate-500"
                >
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/40"
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-4 py-3.5 text-sm text-slate-300 ${col.className ?? ""}`}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[String(col.key)] ?? "")}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="px-2.5 py-1 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-400/10"
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
