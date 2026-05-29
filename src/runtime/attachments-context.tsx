"use client";

import { createContext, useContext, type ReactNode } from "react";

const TimbalAttachmentsEnabledContext = createContext(false);

export function TimbalAttachmentsEnabledProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <TimbalAttachmentsEnabledContext.Provider value={enabled}>
      {children}
    </TimbalAttachmentsEnabledContext.Provider>
  );
}

/** Whether {@link TimbalRuntimeProvider} registered an attachment adapter. */
export function useTimbalAttachmentsEnabled(): boolean {
  return useContext(TimbalAttachmentsEnabledContext);
}
