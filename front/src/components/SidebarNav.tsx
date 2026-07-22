import { useState, type ComponentType } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

type Icon = ComponentType<{ className?: string }>;

export interface NavLeaf {
  to: string;
  label: string;
  icon?: Icon;
  exact?: boolean;
}

export interface NavGroup {
  label: string;
  icon: Icon;
  children: NavLeaf[];
}

export type NavItem = NavLeaf | NavGroup;

const isGroup = (item: NavItem): item is NavGroup => "children" in item;

const LEAF = "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900";
const LEAF_ACTIVE = "flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-gray-100 font-medium text-gray-900";
const CHILD = "block rounded-md px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900";
const CHILD_ACTIVE = "block rounded-md px-3 py-1.5 text-sm bg-gray-100 font-medium text-gray-900";

function LeafLink({ item }: { item: NavLeaf }) {
  const Icon = item.icon;
  return (
    <Link to={item.to} activeOptions={{ exact: item.exact }} className={LEAF} activeProps={{ className: LEAF_ACTIVE }}>
      {Icon && <Icon className="h-4 w-4" />}
      {item.label}
    </Link>
  );
}

function Group({ group }: { group: NavGroup }) {
  const { pathname } = useLocation();
  const hasActiveChild = group.children.some((child) => pathname.startsWith(child.to));
  // null = follow the active child; true/false once the user toggles manually.
  const [open, setOpen] = useState<boolean | null>(null);
  const expanded = open ?? hasActiveChild;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!expanded)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
      >
        <group.icon className="h-4 w-4" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>
      {expanded && (
        <ul className="ml-[1.4rem] mt-0.5 space-y-0.5 border-l border-border pl-3">
          {group.children.map((child) => (
            <li key={child.to}>
              <Link to={child.to} activeOptions={{ exact: child.exact }} className={CHILD} activeProps={{ className: CHILD_ACTIVE }}>
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={isGroup(item) ? item.label : item.to}>
          {isGroup(item) ? <Group group={item} /> : <LeafLink item={item} />}
        </li>
      ))}
    </ul>
  );
}
