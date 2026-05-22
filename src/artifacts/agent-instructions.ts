/**
 * Copy-paste this into a workforce agent system prompt (or append it to your
 * blueprint's tool-result instructions) so the model knows which artifact
 * payloads the chat UI can render.
 *
 * @example
 * ```ts
 * import { ARTIFACT_AGENT_INSTRUCTIONS } from "@timbal-ai/timbal-react";
 *
 * const systemPrompt = `${basePrompt}\n\n${ARTIFACT_AGENT_INSTRUCTIONS}`;
 * ```
 */
export const ARTIFACT_AGENT_INSTRUCTIONS = `
## Rich artifacts (Timbal chat UI)

When you need charts, tables, choice widgets, or interactive controls, return a **JSON artifact object** instead of plain prose. The chat UI renders these automatically.

### Delivery channels (either works)

1. **Tool result (preferred)** — return a single JSON object (or a JSON string) from a tool. The object must include a string \`type\` field.
2. **Inline markdown fence** — embed the same JSON inside a fenced block:

\`\`\`timbal-artifact
{"type":"chart","data":[{"month":"Jan","sales":120}]}
\`\`\`

The alias \`\`\`timbal\`\`\` is also accepted.

### Built-in artifact types

| \`type\` | Use for |
|---|---|
| \`chart\` | Bar, line, area, or pie charts. Fields: \`data\`, optional \`chartType\`, \`xKey\`, \`dataKey\`, \`title\`, \`unit\`. |
| \`table\` | Tabular data. Fields: \`rows\`, optional \`columns\`, \`title\`. |
| \`question\` | In-thread multiple choice. Fields: \`options: [{ id, label, description? }]\`, optional \`prompt\`, \`multi\`. User replies are sent back as a normal user message. |
| \`html\` | Custom HTML/CSS/JS in an iframe. Fields: \`content\` (HTML document or fragment), optional \`title\`, \`height\`, \`sandboxed\` (default \`true\`; set \`false\` for unrestricted scripts/CDN). |
| \`json\` | Fallback structured view. Fields: \`data\`, optional \`title\`. |
| \`ui\` | **Interactive UI** composed from a fixed node palette (hover, click, drag). See below. |

### When to use \`type: "html"\`

Use \`html\` when the user wants a **rich visual or interactive page** that does not fit the \`ui\` palette — e.g. styled layouts, SVG graphics, CSS animations, canvas, small games, calculators, or multi-section mockups. Pass a full HTML document or a body fragment in \`content\`.

- Inline \`<style>\`, \`<script>\`, SVG, and canvas are supported.
- Default \`sandboxed: true\` runs in an isolated iframe with scripts enabled.
- Set \`sandboxed: false\` only for trusted content that needs external CDN scripts/styles or full DOM freedom.
- Prefer \`ui\` when controls should send chat messages or host events; prefer \`html\` for self-contained mini-apps and visual demos.

### When to use \`type: "ui"\`

Use a \`ui\` artifact when the user should **hover, click, drag, or adjust controls** in-thread and those actions should integrate with the chat runtime (messages, \`onArtifactEvent\`). For standalone visual/interactive HTML, use \`html\` instead.

Each \`ui\` artifact has:

- \`initialState\` — optional object seeding local state (per widget instance).
- \`root\` — a single node tree (see node kinds below).
- optional \`title\` — card heading.

**Bindings:** anywhere a primitive is accepted, you may use \`{ "$bind": "dotted.path" }\` to read from \`initialState\` / local state (e.g. \`{ "$bind": "qty" }\`).

**Actions:** nodes may attach \`onClick\`, \`onChange\`, or \`onDragEnd\` with one action or an array:

| Action | Shape | Effect |
|---|---|---|
| User message | \`{ "kind": "message", "text": "..." }\` or \`{ "kind": "message", "text": { "$bind": "path" } }\` | Sends text as the next user message. |
| Set state | \`{ "kind": "set", "path": "foo", "value": 1 }\` | Writes local widget state. |
| Toggle boolean | \`{ "kind": "toggle", "path": "enabled" }\` | Flips a boolean at \`path\`. |
| Host event | \`{ "kind": "emit", "name": "event-name", "payload": { ... } }\` | Bubbles to the host app (\`onArtifactEvent\` on \`<Thread>\`). |

### \`ui\` node palette (\`root.kind\`)

| \`kind\` | Purpose | Key fields |
|---|---|---|
| \`box\` | Layout container | \`children\`, \`direction\` (\`row\`/\`col\`), \`gap\`, \`padding\`, \`align\`, \`justify\`, \`wrap\` |
| \`text\` | Body text | \`value\`, optional \`muted\`, \`size\`, \`weight\` |
| \`heading\` | Heading | \`value\`, optional \`level\` (1–4) |
| \`badge\` | Pill label | \`value\`, optional \`tone\` (\`default\`, \`primary\`, \`success\`, \`warn\`, \`danger\`) |
| \`button\` | Clickable button | \`label\`, optional \`variant\`, \`size\`, \`disabled\`, \`onClick\` |
| \`toggle\` | Boolean switch | \`binding\` (state path), optional \`label\`, \`onChange\` |
| \`slider\` | Numeric range | \`binding\`, optional \`min\`, \`max\`, \`step\`, \`label\`, \`showValue\`, \`onChange\` |
| \`tooltip\` | Hover tooltip | \`content\`, \`child\` (single node), optional \`side\` |
| \`draggable\` | Drag gesture | \`child\`, optional \`axis\` (\`x\`/\`y\`/\`both\`), \`snapBack\`, \`onDragEnd\` |
| \`custom\` | Host-registered widget | \`name\`, optional \`props\`, \`children\` — only if the app registered that name |

### Example \`ui\` artifact

\`\`\`json
{
  "type": "ui",
  "title": "Configure plan",
  "initialState": { "qty": 1, "premium": false },
  "root": {
    "kind": "box",
    "direction": "col",
    "gap": 3,
    "children": [
      { "kind": "heading", "value": "Choose quantity", "level": 3 },
      {
        "kind": "tooltip",
        "content": "Drag to adjust quantity",
        "child": {
          "kind": "slider",
          "binding": "qty",
          "min": 1,
          "max": 50,
          "label": "Quantity",
          "onChange": { "kind": "emit", "name": "qty-changed" }
        }
      },
      { "kind": "toggle", "binding": "premium", "label": "Premium support" },
      {
        "kind": "button",
        "label": "Confirm",
        "onClick": { "kind": "message", "text": { "$bind": "qty" } }
      }
    ]
  }
}
\`\`\`

### Rules

- Always set \`type\` to a built-in value above unless the app documented a custom type.
- Prefer \`ui\` over \`html\` when actions must bubble to the host chat (\`message\`, \`emit\`).
- Prefer \`question\` for simple A/B/C choices; use \`ui\` when you need sliders, toggles, drag, or multi-control layouts.
- Keep \`data\` arrays reasonably small (charts/tables).

### After calling an artifact tool (critical)

When you call a tool that returns an artifact (\`make_chart\`, \`ask_question\`, \`show_table\`, \`show_html\`, \`make_ui_demo\`, etc.):

1. **Do not** paste, quote, paraphrase as JSON, or fence the tool return value in your assistant message. The chat UI already renders it from the tool result.
2. **Do not** emit a matching \`\`\`timbal-artifact\`\`\` block for the same payload — pick **one** channel (tool result only).
3. Your follow-up text should be **empty**, or at most **one short sentence** (e.g. "Pick an option above." / "Try the controls."). Never include \`type\`, \`options\`, \`data\`, or dict/JSON syntax.
4. Treat the widget as visible to the user; refer to it as "above" / "the chart" / "the choices" — never reproduce its contents.
`.trim();
