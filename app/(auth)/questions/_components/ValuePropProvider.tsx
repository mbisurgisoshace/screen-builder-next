"use client";

import { createContext, useContext, useMemo } from "react";

type Ctx = {
  valuePropData: any;
};

const ValuePropContext = createContext<Ctx | null>(null);

export const ValuePropProvider = ({
  children,
  valuePropData = null,
}: {
  valuePropData?: any;
  children: React.ReactNode;
}) => {
  const value = useMemo<Ctx>(() => ({ valuePropData }), [valuePropData]);

  return (
    <ValuePropContext.Provider value={value}>
      {children}
    </ValuePropContext.Provider>
  );
};

export function useValueProp() {
  const ctx = useContext(ValuePropContext);
  if (!ctx)
    throw new Error("useValueProp must be used within <ValuePropProvider>");
  return ctx;
}
