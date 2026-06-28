"use client";

import { createContext, useContext, type FC, type ReactNode } from "react";

import {
  APP_DENSITY_CLASSES,
  appDensityClass,
  type AppDensity,
  type AppDensityClassKey,
} from "../../design/app-density";

const AppDensityContext = createContext<AppDensity>("default");

export interface AppDensityProviderProps {
  density?: AppDensity;
  children: ReactNode;
}

/** Sets layout density for descendant app-kit blocks (`Page`, `Section`, cards, metrics). */
export const AppDensityProvider: FC<AppDensityProviderProps> = ({
  density = "default",
  children,
}) => {
  return (
    <AppDensityContext.Provider value={density}>{children}</AppDensityContext.Provider>
  );
};

/** Active layout density — `"default"` outside a provider. */
export function useAppDensity(): AppDensity {
  return useContext(AppDensityContext);
}

/** Resolved layout class for the active density (or an explicit override). */
export function useAppDensityClass(
  key: AppDensityClassKey,
  override?: AppDensity,
): string {
  const inherited = useAppDensity();
  return appDensityClass(key, override ?? inherited);
}

export { APP_DENSITY_CLASSES, type AppDensity, type AppDensityClassKey };
