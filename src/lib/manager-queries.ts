import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import {
  deleteRecord,
  insertRecord,
  listManyRecords,
  listRecords,
  updateRecord,
  type Row,
} from "./manager-data.functions";
import type { ManagerTable } from "./manager-tables";

export type { Row };

export interface ListSpec {
  table: ManagerTable;
  select?: string;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  filters?: Array<{
    column: string;
    op?: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "is";
    value: string | number | boolean | null | string[];
  }>;
}

function normalize(spec: ListSpec) {
  return {
    table: spec.table,
    select: spec.select ?? "*",
    orderBy: spec.orderBy,
    ascending: spec.ascending ?? false,
    limit: spec.limit ?? 200,
    filters: (spec.filters ?? []).map((f) => ({ ...f, op: f.op ?? "eq" })),
  };
}

/** Read one table. */
export function useRecords(spec: ListSpec) {
  const fn = useServerFn(listRecords);
  const payload = normalize(spec);
  return useQuery({
    queryKey: ["manager", payload],
    queryFn: () => fn({ data: payload }),
    staleTime: 15_000,
  });
}

/** Read several tables in a single round trip. */
export function useManyRecords(specs: ListSpec[]) {
  const fn = useServerFn(listManyRecords);
  const requests = specs.map(normalize);
  return useQuery({
    queryKey: ["manager", "many", requests],
    queryFn: () => fn({ data: { requests } }),
    staleTime: 15_000,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["manager"] });
}

export function useUpdateRecord(successMessage = "Saved") {
  const fn = useServerFn(updateRecord);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (vars: { table: ManagerTable; id: string; values: Record<string, unknown> }) =>
      fn({ data: vars }),
    onSuccess: () => {
      invalidate();
      toast.success(successMessage);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useInsertRecord(successMessage = "Created") {
  const fn = useServerFn(insertRecord);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (vars: { table: ManagerTable; values: Record<string, unknown> }) =>
      fn({ data: vars }),
    onSuccess: () => {
      invalidate();
      toast.success(successMessage);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteRecord(successMessage = "Deleted") {
  const fn = useServerFn(deleteRecord);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (vars: { table: ManagerTable; id: string }) => fn({ data: vars }),
    onSuccess: () => {
      invalidate();
      toast.success(successMessage);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Live HTTP probe of every registered service endpoint. */
export function useHealthChecks() {
  const fn = useServerFn(runHealthChecks);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (vars?: { serviceIds?: string[] }) => fn({ data: vars ?? {} }),
    onSuccess: (results) => {
      invalidate();
      const checked = results.filter((r) => r.status !== "skipped");
      const down = checked.filter((r) => r.status === "down").length;
      const degraded = checked.filter((r) => r.status === "degraded").length;
      toast.success(
        `Probed ${checked.length} endpoints — ${checked.length - down - degraded} healthy, ${degraded} degraded, ${down} down`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Real chat completion against the AI gateway, logged to decision + usage tables. */
export function useModelTest() {
  const fn = useServerFn(runModelTest);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (vars: { modelRowId: string; prompt: string }) => fn({ data: vars }),
    onSuccess: (r) => {
      invalidate();
      toast.success(`${r.model} replied in ${r.latencyMs}ms (${r.tokensIn + r.tokensOut} tokens)`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

