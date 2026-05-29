"use client";

import { createContext, useContext, type FC, type ReactNode } from "react";

export type AppCopilotContextValue = Record<string, unknown>;

const AppCopilotContext = createContext<AppCopilotContextValue | null>(null);

export interface AppCopilotProviderProps {
  value: AppCopilotContextValue;
  children: ReactNode;
}

/** Supplies page/dashboard context for `AppChatPanel` and agent tools. */
export const AppCopilotProvider: FC<AppCopilotProviderProps> = ({
  value,
  children,
}) => {
  return (
    <AppCopilotContext.Provider value={value}>{children}</AppCopilotContext.Provider>
  );
};

export function useAppCopilotContext(): AppCopilotContextValue {
  return useContext(AppCopilotContext) ?? {};
}
