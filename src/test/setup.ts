import { afterEach, beforeAll } from "bun:test";
import { GlobalWindow } from "happy-dom";
import "@testing-library/jest-dom";

const window = new GlobalWindow();

// Inject browser globals into the bun test environment
Object.defineProperties(globalThis, {
  window: { value: window, writable: true, configurable: true },
  document: { value: window.document, writable: true, configurable: true },
  navigator: { value: window.navigator, writable: true, configurable: true },
  localStorage: { value: window.localStorage, writable: true, configurable: true },
  sessionStorage: { value: window.sessionStorage, writable: true, configurable: true },
  location: { value: window.location, writable: true, configurable: true },
  history: { value: window.history, writable: true, configurable: true },
  CustomEvent: { value: window.CustomEvent, writable: true, configurable: true },
  Event: { value: window.Event, writable: true, configurable: true },
  HTMLElement: { value: window.HTMLElement, writable: true, configurable: true },
  Element: { value: window.Element, writable: true, configurable: true },
  Node: { value: window.Node, writable: true, configurable: true },
  // Radix focus-scope / dismissable-layer walk the DOM via createTreeWalker,
  // which needs the NodeFilter constants — required to render an open Dialog/Sheet.
  NodeFilter: { value: window.NodeFilter, writable: true, configurable: true },
  // Lets `value instanceof HTMLImageElement` guards (e.g. shader brands) resolve
  // instead of throwing a ReferenceError in the test DOM.
  HTMLImageElement: { value: window.HTMLImageElement, writable: true, configurable: true },
  Text: { value: window.Text, writable: true, configurable: true },
  Comment: { value: window.Comment, writable: true, configurable: true },
  DocumentFragment: { value: window.DocumentFragment, writable: true, configurable: true },
  MutationObserver: { value: window.MutationObserver, writable: true, configurable: true },
  ResizeObserver: { value: window.ResizeObserver, writable: true, configurable: true },
  getComputedStyle: { value: window.getComputedStyle.bind(window), writable: true, configurable: true },
  requestAnimationFrame: { value: (cb: FrameRequestCallback) => setTimeout(cb, 0), writable: true, configurable: true },
  cancelAnimationFrame: { value: clearTimeout, writable: true, configurable: true },
  FileReader: { value: window.FileReader, writable: true, configurable: true },
  File: { value: window.File, writable: true, configurable: true },
  Blob: { value: window.Blob, writable: true, configurable: true },
});

// Radix focus management uses `instanceof HTMLInputElement` / HTMLButtonElement
// / HTMLAnchorElement … to find tabbable nodes. Copy every HTML*Element
// constructor happy-dom exposes so an open Dialog/Sheet doesn't ReferenceError.
for (const key of Object.getOwnPropertyNames(window)) {
  if (
    /^HTML[A-Za-z]*Element$/.test(key) &&
    typeof (globalThis as Record<string, unknown>)[key] === "undefined"
  ) {
    Object.defineProperty(globalThis, key, {
      value: (window as unknown as Record<string, unknown>)[key],
      writable: true,
      configurable: true,
    });
  }
}

// Now import cleanup from @testing-library/react at top-level using require
// to prevent ES module hoisting so that globals are defined first.
const { cleanup } = require("@testing-library/react");

afterEach(() => {
  cleanup();
});
