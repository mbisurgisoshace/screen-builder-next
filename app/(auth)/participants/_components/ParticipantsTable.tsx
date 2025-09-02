"use client";

import {
  ColumnDef,
  flexRender,
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns/format";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function ParticipantsTable({ data }: { data: any[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-[#EFF0F4]">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="font-bold text-xs">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="text-sm font-medium text-[#111827]"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

const columns: ColumnDef<any>[] = [
  {
    accessorKey: "name",
    header: "Participant",
    cell: ({ row }) => {
      const participantId = row.original.id;
      return (
        <div className="capitalize">
          <Link
            href={`/participants/${participantId}`}
            className="hover:underline"
          >
            {row.getValue("name")}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as "user" | "customer";

      return (
        <div className="capitalize">
          <Badge
            className={`${
              role === "customer"
                ? "bg-[#F4F0FF] text-[#6A35FF]"
                : "bg-[#F4F0FF] text-[#6A35FF]"
            } text-[10px] font-semibold h-6`}
          >
            {role}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "contact_info",
    header: "Contact Info",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("contact_info")}</div>
    ),
  },
  {
    accessorKey: "rationale",
    header: "Rationale",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("rationale")}</div>
    ),
  },
  {
    accessorKey: "blocking_issues",
    header: "Blocking Issues",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("blocking_issues")}</div>
    ),
  },
  {
    accessorKey: "scheduled_date",
    header: "Schedule Date",
    cell: ({ row }) => {
      const schedule_date = format(
        row.getValue("scheduled_date"),
        "MMM d, k:mm"
      );

      return <div className="capitalize">{schedule_date}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as "complete" | "incomplete";

      return (
        <div className="capitalize">
          <Badge
            className={`${
              status === "complete"
                ? "bg-[#D4ECDC] text-[#254F2B]"
                : "bg-red-200 text-red-800"
            } text-[10px] font-semibold h-6`}
          >
            {status}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original;
      return <div></div>;
    },
  },
];
