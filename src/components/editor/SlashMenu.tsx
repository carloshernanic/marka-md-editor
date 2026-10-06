"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import type { SuggestionKeyDownProps } from "@tiptap/suggestion";
import type { SlashItem } from "./slash-items";

export type SlashMenuProps = {
  items: SlashItem[];
  command: (item: SlashItem) => void;
};

export type SlashMenuRef = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
};

export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(function SlashMenu(
  { items, command },
  ref,
) {
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [items]);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(`[data-slash-index="${index}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [index]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setIndex((i) => (i + items.length - 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "ArrowDown") {
        setIndex((i) => (i + 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        if (items[index]) command(items[index]);
        return true;
      }
      return false;
    },
  }));

  const groups = useMemo(() => {
    const map = new Map<string, { item: SlashItem; idx: number }[]>();
    items.forEach((item, idx) => {
      const list = map.get(item.group) ?? [];
      list.push({ item, idx });
      map.set(item.group, list);
    });
    return Array.from(map.entries());
  }, [items]);

  return (
    <div
      className="animate-pop w-80 max-h-[360px] overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-pop"
      role="listbox"
    >
      {items.length === 0 ? (
        <div className="px-3 py-6 text-center text-sm text-fg-muted">Nenhum resultado</div>
      ) : (
        groups.map(([group, list]) => (
          <div key={group} className="mb-1 last:mb-0">
            <div className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-fg-faint">
              {group}
            </div>
            {list.map(({ item, idx }) => {
              const Icon = item.icon;
              const active = idx === index;
              return (
                <button
                  key={item.title}
                  type="button"
                  role="option"
                  aria-selected={active}
                  data-slash-index={idx}
                  onMouseEnter={() => setIndex(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => command(item)}
                  className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                    active ? "bg-fg/[0.06] dark:bg-fg/[0.08]" : ""
                  }`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-fg">
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-fg">{item.title}</span>
                    <span className="block truncate text-xs text-fg-muted">{item.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
});
