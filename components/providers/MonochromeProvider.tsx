"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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

function readMonochromeFromDom(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("monochrome");
}

export function MonochromeProvider({
  initialMonochrome,
  children,
}: {
  initialMonochrome: boolean;
  children: React.ReactNode;
}) {
  const [monochrome, setMonochromeState] = useState(initialMonochrome);

  const setMonochrome = useCallback((enabled: boolean) => {
    setMonochromeState(enabled);
    document.documentElement.classList.toggle("monochrome", enabled);
    document.documentElement.dataset.monochrome = enabled ? "true" : "false";
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("monochrome", initialMonochrome);
    document.documentElement.dataset.monochrome = initialMonochrome
      ? "true"
      : "false";
    setMonochromeState(initialMonochrome);
  }, [initialMonochrome]);

  return (
    <MonochromeContext.Provider value={{ monochrome, setMonochrome }}>
      {children}
    </MonochromeContext.Provider>
  );
}

export { readMonochromeFromDom };
