import * as React from "react";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

export type ToastProps = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
};

type ToastState = {
  toasts: ToastProps[];
  add: (toast: Omit<ToastProps, "id">) => string;
  dismiss: (id: string) => void;
  remove: (id: string) => void;
};

const listeners = new Set<(state: ToastState) => void>();
let memoryState: ToastState = {
  toasts: [],
  add: () => "",
  dismiss: () => {},
  remove: () => {},
};

function dispatch(partial: Partial<Pick<ToastState, "toasts">>) {
  memoryState = { ...memoryState, ...partial };
  for (const listener of listeners) listener(memoryState);
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const removeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleRemove(id: string, delay = TOAST_REMOVE_DELAY) {
  if (removeTimeouts.has(id)) return;
  const timeout = setTimeout(() => {
    removeTimeouts.delete(id);
    dispatch({
      toasts: memoryState.toasts.filter((t) => t.id !== id),
    });
  }, delay);
  removeTimeouts.set(id, timeout);
}

function addToast(toastInput: Omit<ToastProps, "id">) {
  const id = genId();
  dispatch({
    toasts: [{ ...toastInput, id }, ...memoryState.toasts].slice(0, TOAST_LIMIT),
  });
  scheduleRemove(id, toastInput.duration ?? TOAST_REMOVE_DELAY);
  return id;
}

function dismissToast(id: string) {
  scheduleRemove(id, 300);
}

memoryState = {
  toasts: [],
  add: addToast,
  dismiss: dismissToast,
  remove: (id) => {
    dispatch({ toasts: memoryState.toasts.filter((t) => t.id !== id) });
  },
};

export function toast(input: Omit<ToastProps, "id">) {
  return memoryState.add(input);
}

export function useToast() {
  const [state, setState] = React.useState(memoryState);

  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    toasts: state.toasts,
    toast,
    dismiss: state.dismiss,
  };
}
