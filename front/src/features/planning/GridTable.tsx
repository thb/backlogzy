import { flexRender, type Table } from "@tanstack/react-table";
import { toDateStr } from "@/lib/dates";

type DateRow = { date: string };

/** Renders the planning table markup (header with resize handles + day rows). */
export function GridTable({
  table,
  pastelByColId,
}: {
  table: Table<DateRow>;
  pastelByColId: Record<string, string>;
}) {
  return (
    <table className="w-full border-collapse text-sm" style={{ tableLayout: "fixed" }}>
      <thead className="sticky top-0 z-10">
        <tr className="bg-gray-50">
          {table.getHeaderGroups().map((hg) =>
            hg.headers.map((header) => {
              const pastel = pastelByColId[header.column.id] ?? "";
              return (
                <th
                  key={header.id}
                  className={`relative border border-gray-200 px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide ${pastel || "bg-gray-50"}`}
                  style={{ width: header.getSize() }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getCanResize() && (
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-blue-400 ${header.column.getIsResizing() ? "bg-blue-500" : ""}`}
                    />
                  )}
                </th>
              );
            }),
          )}
        </tr>
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            className={row.original.date === toDateStr(new Date()) ? "bg-blue-50/30" : ""}
          >
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className={`border border-gray-200 align-top ${pastelByColId[cell.column.id] ?? ""}`}
                style={{ width: cell.column.getSize() }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
