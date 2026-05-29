import { describe, it, expect, afterEach } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import { TimbalChat } from "./chat";
import { TooltipProvider } from "../ui/tooltip";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// TimbalChat wraps TimbalRuntimeProvider which calls fetch for streaming.
// We point it at a no-op fetch so the runtime initialises without errors.
const noop = () => new Promise<Response>(() => {});

afterEach(() => {
  cleanup();
});

function renderChat(props: Partial<Parameters<typeof TimbalChat>[0]> = {}) {
  return render(
    <TooltipProvider>
      <TimbalChat
        workforceId="test-workforce"
        fetch={noop}
        {...props}
      />
    </TooltipProvider>,
  );
}

// ---------------------------------------------------------------------------
// Welcome screen
// ---------------------------------------------------------------------------

describe("welcome screen", () => {
  it("renders the default heading when no welcome prop is given", () => {
    renderChat();
    expect(screen.getByText("How can I help you today?")).toBeInTheDocument();
  });

  it("renders a custom heading", () => {
    renderChat({ welcome: { heading: "Hello there" } });
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("renders a custom subheading", () => {
    renderChat({ welcome: { subheading: "Fire away." } });
    expect(screen.getByText("Fire away.")).toBeInTheDocument();
  });

  it("renders suggestion chips", () => {
    renderChat({
      suggestions: [
        { title: "Summarize my week" },
        { title: "What can you do?", description: "Get an overview" },
      ],
    });
    expect(screen.getByText("Summarize my week")).toBeInTheDocument();
    expect(screen.getByText("What can you do?")).toBeInTheDocument();
    expect(screen.getByText("Get an overview")).toBeInTheDocument();
  });

  it("renders no suggestion chips when suggestions is empty", () => {
    renderChat({ suggestions: [] });
    // welcome heading should still appear
    expect(screen.getByText("How can I help you today?")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

describe("composer", () => {
  it("renders the default placeholder", () => {
    renderChat();
    expect(screen.getByPlaceholderText("Send a message...")).toBeInTheDocument();
  });

  it("renders a custom placeholder", () => {
    renderChat({ composerPlaceholder: "Ask me anything..." });
    expect(screen.getByPlaceholderText("Ask me anything...")).toBeInTheDocument();
  });

  it("hides the add-attachment button when attachments are not enabled", () => {
    renderChat();
    expect(screen.queryByLabelText("Add Attachment")).toBeNull();
  });

  it("renders the add-attachment button when attachments are enabled", () => {
    renderChat({ attachments: true });
    expect(screen.getByLabelText("Add Attachment")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// components prop — slot overrides
// ---------------------------------------------------------------------------

describe("components prop", () => {
  it("renders a custom Welcome component", () => {
    renderChat({
      components: {
        Welcome: () => <div>Custom welcome</div>,
      },
    });
    expect(screen.getByText("Custom welcome")).toBeInTheDocument();
  });

  it("renders a custom Composer component", () => {
    renderChat({
      components: {
        Composer: () => <div>Custom composer</div>,
      },
    });
    expect(screen.getByText("Custom composer")).toBeInTheDocument();
  });

  it("forwards composerPlaceholder to a custom Composer component", () => {
    renderChat({
      composerPlaceholder: "Custom placeholder",
      components: {
        Composer: ({ placeholder }) => <input placeholder={placeholder} />,
      },
    });
    expect(screen.getByPlaceholderText("Custom placeholder")).toBeInTheDocument();
  });

  it("accepts onArtifactEvent without error", () => {
    renderChat({
      onArtifactEvent: () => {},
    });
    expect(screen.getByText("How can I help you today?")).toBeInTheDocument();
  });

  it("passes welcome config and suggestions to a custom Welcome component", () => {
    renderChat({
      welcome: { heading: "Passed heading" },
      suggestions: [{ title: "Passed suggestion" }],
      components: {
        Welcome: ({ config, suggestions }) => (
          <div>
            <span>{config?.heading}</span>
            {suggestions?.map((s) => <span key={s.title}>{s.title}</span>)}
          </div>
        ),
      },
    });
    expect(screen.getByText("Passed heading")).toBeInTheDocument();
    expect(screen.getByText("Passed suggestion")).toBeInTheDocument();
  });
});
