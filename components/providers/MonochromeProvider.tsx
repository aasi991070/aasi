"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { cn } from "@/lib/utils/cn";

interface MonochromeContextValue {
  monochrome: boolean;
  setMonochrome: (enabled: boolean) => void;
}

const MonochromeContext = createContext<MonochromeContextValue>({
  monochrome: false,
  setMonochrome: () => {},
});

export function useMonochrome() {
  return useContext(MonochromeContext);
}

export function MonochromeProvider({
  initialMonochrome,
  className,
  children,
}: {
  initialMonochrome: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [monochrome, setMonochromeState] = useState(initialMonochrome);

  const setMonochrome = useCallback((enabled: boolean) => {
    setMonochromeState(enabled);
  }, []);

  useEffect(() => {
    setMonochromeState(initialMonochrome);
  }, [initialMonochrome]);

  return (
    <MonochromeContext.Provider value={{ monochrome, setMonochrome }}>
      <div
        className={cn(className, monochrome && "monochrome")}
        data-monochrome={monochrome ? "true" : "false"}
      >
        {children}
      </div>
    </MonochromeContext.Provider>
  );
}
