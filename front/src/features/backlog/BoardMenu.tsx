import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreVertical, Archive, Trash2, Check } from "lucide-react";

const ITEM = "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 outline-none data-[highlighted]:bg-gray-100";

// "⋮" board options menu (Radix): show-archived toggle, delete board.
export function BoardMenu({
  showArchived,
  onToggleArchived,
  onRequestDelete,
}: {
  showArchived: boolean;
  onToggleArchived: (value: boolean) => void;
  onRequestDelete: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Board options"
          className="rounded p-1 text-gray-400 outline-none hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className="z-50 w-52 rounded-lg border border-border bg-white p-1.5 shadow-lg">
          <DropdownMenu.Item className={ITEM} onSelect={() => onToggleArchived(!showArchived)}>
            <Archive className="h-4 w-4 text-gray-400" />
            <span className="flex-1">Show archived</span>
            {showArchived && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            className={`${ITEM} text-destructive data-[highlighted]:bg-red-50`}
            onSelect={onRequestDelete}
          >
            <Trash2 className="h-4 w-4" />
            Delete board
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
