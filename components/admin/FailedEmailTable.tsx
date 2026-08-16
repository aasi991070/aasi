"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { resendFailedEmailAction } from "@/lib/actions/email";
import { useUiStore } from "@/hooks/useUiStore";
import type { EmailLogEntry } from "@/types";

interface FailedEmailTableProps {
  entries: EmailLogEntry[];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function FailedEmailTable({ entries }: FailedEmailTableProps) {
  const router = useRouter();
  const { showToast } = useUiStore();
  const [isPending, startTransition] = useTransition();

  const handleResend = (id: string) => {
    startTransition(async () => {
      const result = await resendFailedEmailAction(id);
      if (result.ok) {
        showToast("Email resent", "success");
        router.refresh();
        return;
      }
      showToast(result.message, "error");
    });
  };

  return (
    <div className="v18-card overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>When</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Template</TableHead>
            <TableHead>Error</TableHead>
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{formatDate(entry.created_at)}</TableCell>
              <TableCell>{entry.to_email}</TableCell>
              <TableCell className="font-mono text-xs">{entry.template}</TableCell>
              <TableCell className="max-w-xs truncate text-sm text-red-600">
                {entry.error ?? "Unknown error"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending || entry.template === "contact_receipt"}
                  onClick={() => handleResend(entry.id)}
                >
                  Resend
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
