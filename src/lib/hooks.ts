"use client";

import { useEffect, useState } from "react";

export function useFetch<T>(url: string | null, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Error al cargar datos");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, reloadKey, ...deps]);

  return { data, loading, error, reload: () => setReloadKey((k) => k + 1) };
}

export function useCatalogs() {
  const { data: projectsData } = useFetch<{ id: string; name: string }[]>("/api/projects");
  const { data: usersData } = useFetch<{ id: string; name: string; role: string }[]>("/api/users");
  return { projects: projectsData || [], users: usersData || [] };
}
