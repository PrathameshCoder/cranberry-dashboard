"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KnowledgeViewDialog, type KnowledgeItem } from "@/components/dashboard/knowledge-view-dialog";

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function SearchClient() {
  const [q, setQ] = useState("");
  const debounced = useDebounced(q, 300);

  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeItem, setActiveItem] = useState<KnowledgeItem | null>(null);

  async function runSearch(query: string) {
    setLoading(true);
    try {
      const r = await fetch(`/api/knowledge/search?q=${encodeURIComponent(query)}`, {
        cache: "no-store",
      });
      const data = await r.json();
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // auto-search as you type
    runSearch(debounced.trim());
  }, [debounced]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">
          Search by title, tags, keywords, or author (e.g., “admin”, “IT”, “Tasks”).
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Hunting for something specific?'
        />
        <Button variant="secondary" onClick={() => runSearch(q.trim())}>
          Search
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          No results. Try different keywords or tags.
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setActiveItem(it)}
              className="rounded-lg border p-4 text-left hover:bg-muted/40 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-medium">{it.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {it.summary}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(it.createdAt).toLocaleDateString()}
                </span>
              </div>
              {it.tags?.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                  {it.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full border px-2 py-0.5"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </button>
          ))}
        </div>
      )}

      <KnowledgeViewDialog
        open={!!activeItem}
        onOpenChange={(o: boolean) => !o && setActiveItem(null)}
        item={activeItem}
      />
    </div>
  );
}
