interface PaginationProps {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}

export function Pagination({ page, pages, onPage }: PaginationProps) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <span className="text-xs text-gray-500">
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
