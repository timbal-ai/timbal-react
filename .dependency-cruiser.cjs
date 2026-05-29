/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "design-no-upstream",
      comment: "design/ must not import chat, studio, app, or runtime",
      severity: "error",
      from: { path: "^src/design" },
      to: {
        path: "^src/(chat|studio|app|runtime|artifacts|auth|components)",
      },
    },
    {
      name: "ui-no-assistant-ui",
      comment: "ui/ must not depend on @assistant-ui/react",
      severity: "error",
      from: { path: "^src/ui" },
      to: { path: "@assistant-ui/react" },
    },
    {
      name: "app-no-studio",
      comment:
        "app/ and studio/ are sibling blueprint layers; coordinate via src/layout/ (neutral inset channel), never by importing each other",
      severity: "error",
      from: { path: "^src/app" },
      to: { path: "^src/studio" },
    },
    {
      name: "studio-no-app",
      comment: "studio/ must not import the app kit (sibling blueprint layer)",
      severity: "error",
      from: { path: "^src/studio" },
      to: { path: "^src/app" },
    },
    {
      name: "chat-no-app",
      comment: "chat/ must not import app kit (app composes chat, not vice versa)",
      severity: "error",
      from: { path: "^src/chat" },
      to: { path: "^src/app" },
    },
    {
      name: "chat-no-studio",
      comment: "chat/ must not import studio (studio composes chat, not vice versa)",
      severity: "error",
      from: { path: "^src/chat" },
      to: { path: "^src/studio" },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
  },
};
