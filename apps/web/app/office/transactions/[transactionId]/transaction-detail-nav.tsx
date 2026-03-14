"use client";

import { useEffect, useMemo, useState } from "react";

type TransactionDetailNavItem = {
  id: string;
  label: string;
};

type TransactionDetailNavProps = {
  items: TransactionDetailNavItem[];
};

function getCurrentSection(items: TransactionDetailNavItem[]) {
  if (typeof window === "undefined" || items.length === 0) {
    return items[0]?.id ?? "";
  }

  const offset = window.scrollY + 180;
  let activeId = items[0]?.id ?? "";

  for (const item of items) {
    const section = document.getElementById(item.id);

    if (section && section.offsetTop <= offset) {
      activeId = item.id;
    }
  }

  return activeId;
}

export function TransactionDetailNav({ items }: TransactionDetailNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    function syncActiveSection() {
      const hashId = window.location.hash.replace(/^#/, "");

      if (hashId && items.some((item) => item.id === hashId)) {
        setActiveId(hashId);
        return;
      }

      setActiveId(getCurrentSection(items));
    }

    syncActiveSection();
    window.addEventListener("scroll", syncActiveSection, { passive: true });
    window.addEventListener("resize", syncActiveSection);
    window.addEventListener("hashchange", syncActiveSection);

    return () => {
      window.removeEventListener("scroll", syncActiveSection);
      window.removeEventListener("resize", syncActiveSection);
      window.removeEventListener("hashchange", syncActiveSection);
    };
  }, [items]);

  const activeLabel = useMemo(
    () => items.find((item) => item.id === activeId)?.label ?? items[0]?.label ?? "",
    [activeId, items]
  );

  return (
    <nav aria-label="Transaction sections" className="office-detail-anchor-nav office-transaction-detail-nav">
      <div className="office-detail-anchor-context">
        <span>Viewing</span>
        <strong>{activeLabel}</strong>
      </div>

      {items.map((item) => (
        <a
          className={activeId === item.id ? "is-active" : undefined}
          href={`#${item.id}`}
          key={item.id}
          onClick={() => setActiveId(item.id)}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
