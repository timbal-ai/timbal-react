/**
 * Copilot contract. The copilot is a self-contained drop-in: it owns its own
 * open/expand state, exposes `useCopilot()` for custom triggers, and never needs
 * `AppShell`. These tests lock that behavior (state machine + hook) without
 * mounting the WebGL trigger glyph / live runtime.
 */
import { act } from "react";
import { beforeEach, describe, expect, it } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AppCopilot, CopilotProvider } from "./app-copilot";
import { CopilotOverlay } from "./copilot-overlay";
import { useCopilot } from "./context";

const TRIGGER_POSITION_STORAGE_KEY = "timbal-copilot-trigger-position";

beforeEach(() => {
  window.localStorage.clear();
});

/**
 * The closed-state trigger is a `pointer-events-none` fixed layer whose only
 * interactive child is the LiquidGlass pill (it carries the overlay's
 * `pointer-events-auto` class and owns the `onClick`). Click the pill, not the
 * wrapper — a click on the wrapper never reaches the descendant's handler.
 */
function getTriggerPill(): Element | null {
  return document.querySelector(
    ".aui-app-shell-chat-trigger-fixed .pointer-events-auto",
  );
}

function TriggerProbe() {
  const controls = useCopilot();
  return (
    <button type="button" onClick={() => controls?.setOpen(!controls.open)}>
      {controls ? (controls.open ? "open" : "closed") : "no-provider"}
    </button>
  );
}

describe("useCopilot", () => {
  it("returns null with no provider (so optional triggers no-op safely)", () => {
    render(<TriggerProbe />);
    expect(screen.getByRole("button").textContent).toBe("no-provider");
  });

  it("CopilotProvider shares open/expand state with custom triggers", () => {
    render(
      <CopilotProvider>
        <TriggerProbe />
      </CopilotProvider>,
    );
    const btn = screen.getByRole("button");
    expect(btn.textContent).toBe("closed");
    act(() => {
      fireEvent.click(btn);
    });
    expect(btn.textContent).toBe("open");
  });

  it("trigger position round-trips through controls and localStorage", () => {
    function PositionProbe() {
      const controls = useCopilot();
      return (
        <div>
          <span data-testid="pos">
            {controls?.triggerPosition
              ? `${controls.triggerPosition.x},${controls.triggerPosition.y}`
              : "default"}
          </span>
          <button
            type="button"
            onClick={() => controls?.setTriggerPosition?.({ x: 0.25, y: 0.5 })}
          >
            move
          </button>
          <button type="button" onClick={() => controls?.resetTriggerPosition?.()}>
            reset
          </button>
        </div>
      );
    }

    render(
      <CopilotProvider>
        <PositionProbe />
      </CopilotProvider>,
    );

    expect(screen.getByTestId("pos").textContent).toBe("default");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "move" }));
    });
    expect(screen.getByTestId("pos").textContent).toBe("0.25,0.5");
    expect(
      JSON.parse(window.localStorage.getItem(TRIGGER_POSITION_STORAGE_KEY)!),
    ).toEqual({ x: 0.25, y: 0.5 });

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "reset" }));
    });
    expect(screen.getByTestId("pos").textContent).toBe("default");
    expect(window.localStorage.getItem(TRIGGER_POSITION_STORAGE_KEY)).toBeNull();
  });
});

describe("AppCopilot", () => {
  it("mounts as a body portal and renders no chrome when closed + hideTrigger", () => {
    const { container } = render(
      <AppCopilot workforceId="test" hideTrigger defaultOpen={false} />,
    );
    // Self-mounting portal: nothing lands in the component's own subtree.
    expect(container.childElementCount).toBe(0);
    // Closed + hideTrigger → no dialog and no floating trigger pill.
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector(".aui-app-shell-chat-trigger-fixed")).toBeNull();
  });

  it("opens when the built-in trigger is clicked", async () => {
    render(
      <CopilotProvider>
        <CopilotOverlay triggerLabel="Concierge">
          <div data-testid="panel-body">panel</div>
        </CopilotOverlay>
      </CopilotProvider>,
    );

    await waitFor(() => {
      expect(getTriggerPill()).not.toBeNull();
    });

    act(() => {
      fireEvent.click(getTriggerPill()!);
    });

    await waitFor(() => {
      expect(screen.getByTestId("panel-body")).toBeTruthy();
    });
  });

  it("renders the real panel on open without a missing TooltipProvider crash", async () => {
    render(<AppCopilot workforceId="test" triggerLabel="Concierge" fetch={async () => new Response("{}", { status: 200 })} />);

    await waitFor(() => {
      expect(getTriggerPill()).not.toBeNull();
    });

    act(() => {
      fireEvent.click(getTriggerPill()!);
    });

    expect(await screen.findByRole("dialog", { name: "Concierge" })).toBeTruthy();
  });
});

describe("draggable trigger pill", () => {
  function renderClosedOverlay() {
    render(
      <CopilotProvider>
        <CopilotOverlay>
          <div data-testid="panel-body">panel</div>
        </CopilotOverlay>
      </CopilotProvider>,
    );
  }

  function getDragHandle(): Element {
    return document.querySelector(".aui-copilot-trigger-handle")!;
  }

  it("drag moves the pill, persists the spot, and never opens the panel", async () => {
    renderClosedOverlay();
    await waitFor(() => {
      expect(getTriggerPill()).not.toBeNull();
    });

    act(() => {
      fireEvent.pointerDown(getDragHandle(), {
        pointerId: 1,
        clientX: 900,
        clientY: 700,
        button: 0,
      });
      fireEvent.pointerMove(window, { pointerId: 1, clientX: 400, clientY: 200 });
      fireEvent.pointerUp(window, { pointerId: 1, clientX: 400, clientY: 200 });
      // The click a browser fires right after the drag's pointerup is swallowed.
      fireEvent.click(getTriggerPill()!);
    });

    expect(screen.queryByTestId("panel-body")).toBeNull();

    const stored = JSON.parse(
      window.localStorage.getItem(TRIGGER_POSITION_STORAGE_KEY)!,
    ) as { x: number; y: number };
    expect(stored.x).toBeGreaterThan(0);
    expect(stored.x).toBeLessThan(1);
    expect(stored.y).toBeGreaterThan(0);
    expect(stored.y).toBeLessThan(1);

    const pill = getTriggerPill() as HTMLElement;
    expect(pill.style.top.endsWith("px")).toBe(true);
    expect(pill.style.left.endsWith("px")).toBe(true);

    // A later, real click (after the suppression flag clears) still opens.
    await new Promise((resolve) => setTimeout(resolve, 10));
    act(() => {
      fireEvent.click(getTriggerPill()!);
    });
    await waitFor(() => {
      expect(screen.getByTestId("panel-body")).toBeTruthy();
    });
  });

  it("dropping the pill near its home corner snaps it back (reset)", async () => {
    window.localStorage.setItem(
      TRIGGER_POSITION_STORAGE_KEY,
      JSON.stringify({ x: 0.2, y: 0.2 }),
    );
    renderClosedOverlay();
    await waitFor(() => {
      expect(getTriggerPill()).not.toBeNull();
    });

    // Drag from the stored spot to within the snap radius of the default corner.
    const home = {
      x: window.innerWidth - 24 - 78,
      y: window.innerHeight - 24 - 26,
    };
    act(() => {
      fireEvent.pointerDown(getDragHandle(), {
        pointerId: 2,
        clientX: 200,
        clientY: 150,
        button: 0,
      });
      fireEvent.pointerMove(window, {
        pointerId: 2,
        clientX: home.x - 20,
        clientY: home.y - 10,
      });
      fireEvent.pointerUp(window, {
        pointerId: 2,
        clientX: home.x - 20,
        clientY: home.y - 10,
      });
    });

    expect(window.localStorage.getItem(TRIGGER_POSITION_STORAGE_KEY)).toBeNull();
    const pill = getTriggerPill() as HTMLElement;
    expect(pill.style.top.startsWith("calc(")).toBe(true);
  });
});
