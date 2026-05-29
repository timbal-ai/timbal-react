import { afterEach } from "bun:test";
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

// Unmount React trees between tests so DOM queries (e.g. getAllByRole) don't
// pick up nodes leaked from a prior render. Imported lazily so Testing Library
// binds `screen` to `document.body` only after the globals above are installed.
afterEach(async () => {
  const { cleanup } = await import("@testing-library/react");
  cleanup();
});
