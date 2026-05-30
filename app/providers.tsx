"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import {
  MonochromeProvider,
  useMonochrome,
} from "@/components/providers/MonochromeProvider";
import { Toaster } from "@/components/ui/sonner";

function AppToaster() {
  const { monochrome } = useMonochrome();

  return (
    <Toaster
      richColors={!monochrome}
      closeButton
      position="top-right"
    />
  );
}

export function Providers({
  children,
  initialMonochrome = false,
}: {
  children: React.ReactNode;
  initialMonochrome?: boolean;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <MonochromeProvider initialMonochrome={initialMonochrome}>
          {children}
          <AppToaster />
        </MonochromeProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
