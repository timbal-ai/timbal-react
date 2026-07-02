import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";

import "./index.css";
import { theme } from "./theme";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme={theme.defaultMode ?? "dark"}
      enableSystem={false}
      storageKey="timbal-theme"
    >
      <App />
    </ThemeProvider>
  </StrictMode>,
);
