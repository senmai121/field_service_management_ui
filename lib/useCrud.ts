"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "./api";
import { ListResponse } from "./types";

export function useCrud<T>(endpoint: string) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(endpoint);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json: ListResponse<T> | T[] = await res.json();
      if (Array.isArray(json)) {
        setData(json);
        setTotal(json.length);
      } else {
        setData(json.data ?? []);
        setTotal(json.total ?? 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (body: unknown) => {
    const res = await apiFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Create failed: ${res.status}`);
    }
    await refresh();
  };

  const update = async (id: string, body: unknown) => {
    const res = await apiFetch(`${endpoint}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Update failed: ${res.status}`);
    }
    await refresh();
  };

  const remove = async (id: string) => {
    const res = await apiFetch(`${endpoint}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Delete failed: ${res.status}`);
    }
    await refresh();
  };

  return { data, total, isLoading, error, refresh, create, update, remove };
}
