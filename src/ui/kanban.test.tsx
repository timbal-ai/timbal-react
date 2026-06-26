import { describe, expect, it } from "bun:test";
import { render, screen, within } from "@testing-library/react";

import { Kanban, type KanbanColumnData } from "./kanban";

interface Task {
  id: string;
  title: string;
}

const columns: KanbanColumnData<Task>[] = [
  {
    id: "todo",
    title: "To do",
    cards: [
      { id: "t1", title: "Design schema" },
      { id: "t2", title: "Draft API" },
    ],
  },
  {
    id: "doing",
    title: "In progress",
    cards: [{ id: "t3", title: "Build UI" }],
  },
  { id: "done", title: "Done", cards: [] },
];

const renderCard = (card: Task) => <span>{card.title}</span>;

describe("Kanban", () => {
  it("renders columns, titles, counts, and cards", () => {
    render(<Kanban columns={columns} renderCard={renderCard} />);

    expect(screen.getByText("To do")).toBeTruthy();
    expect(screen.getByText("In progress")).toBeTruthy();
    expect(screen.getByText("Design schema")).toBeTruthy();
    expect(screen.getByText("Build UI")).toBeTruthy();

    // The board is an accessible list region.
    const board = screen.getByRole("list", { name: "Kanban board" });
    expect(board).toBeTruthy();
  });

  it("places each card under its own column", () => {
    const { container } = render(
      <Kanban columns={columns} renderCard={renderCard} />,
    );
    const cols = container.querySelectorAll('[data-slot="kanban-column"]');
    expect(cols.length).toBe(3);

    const todo = cols[0] as HTMLElement;
    expect(within(todo).getByText("Design schema")).toBeTruthy();
    expect(within(todo).getByText("Draft API")).toBeTruthy();
    expect(within(todo).queryByText("Build UI")).toBeNull();
  });

  it("renders a drop zone with a custom label for empty columns", () => {
    render(
      <Kanban
        columns={columns}
        renderCard={renderCard}
        emptyColumnLabel="Nothing here yet"
      />,
    );
    expect(screen.getByText("Nothing here yet")).toBeTruthy();
  });

  it("exposes a drag handle per card by default", () => {
    render(<Kanban columns={columns} renderCard={renderCard} />);
    expect(screen.getAllByRole("button", { name: "Drag card" }).length).toBe(3);
  });

  it("hides drag handles when disabled (read-only board)", () => {
    render(<Kanban columns={columns} renderCard={renderCard} disabled />);
    expect(screen.queryByRole("button", { name: "Drag card" })).toBeNull();
  });

  it("supports a custom accessible label", () => {
    render(
      <Kanban columns={columns} renderCard={renderCard} aria-label="Sprint board" />,
    );
    expect(screen.getByRole("list", { name: "Sprint board" })).toBeTruthy();
  });
});
