"use client";

import React from "react";

export interface Crumb {
  label: string;
  href?: string;
}

// Parent pages only: the page heading below the breadcrumb is the current page.
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {item.href ? (
              <a href={item.href} className="font-medium text-blue-primary hover:underline dark:text-cyan-400">
                {item.label}
              </a>
            ) : (
              <span className="text-gray-text dark:text-slate-400">{item.label}</span>
            )}
            {index < items.length - 1 && (
              <span aria-hidden="true" className="text-gray-text dark:text-slate-500">/</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
