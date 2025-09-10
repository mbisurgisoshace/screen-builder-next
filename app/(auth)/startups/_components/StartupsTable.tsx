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
import useStartups from "./useStartups";
import { format } from "date-fns";
import { useOrganizationList } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";

export default function StartupsTable({
  data,
  onSelectOrganization,
}: {
  data: any[];
  onSelectOrganization: (organization: any) => void;
}) {
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
                onClick={() => {
                  onSelectOrganization(row.original);
                }}
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
    header: "Startup Name",
    cell: ({ row }) => {
      const participantId = row.original.id;
      return <div className="capitalize">{row.getValue("name")}</div>;
    },
  },
  {
    header: "Founders",
    accessorKey: "founders",
    cell: ({ row }) => {
      return (
        <div className="flex flex-col gap-1">
          {row.original.founders.map((founder: string, index: number) => (
            <Badge className="bg-[#F4F0FF] text-[#6A35FF]" key={index}>
              {founder}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    header: "Mentors",
    accessorKey: "mentors",
    cell: ({ row }) => {
      return (
        <div className="flex flex-col gap-1">
          {row.original.mentors.map((founder: string, index: number) => (
            <Badge className="bg-[#F4F0FF] text-[#6A35FF]" key={index}>
              {founder}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const createdAt = format(row.getValue("createdAt"), "MMM d, k:mm");

      return <div className="capitalize">{createdAt}</div>;
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
