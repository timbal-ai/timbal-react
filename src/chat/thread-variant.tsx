"use client";

import { createContext, useContext } from "react";

export type ThreadVariant = "default" | "panel";

const ThreadVariantContext = createContext<ThreadVariant>("default");

export const ThreadVariantProvider = ThreadVariantContext.Provider;

export function useThreadVariant(): ThreadVariant {
  return useContext(ThreadVariantContext);
}
