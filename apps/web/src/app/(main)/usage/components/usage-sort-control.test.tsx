import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { UsageSortControl } from "./usage-sort-control";

describe("UsageSortControl", () => {
  it("should show the current sort and flip the direction", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <UsageSortControl dir="desc" onChange={onChange} sort="cost" />,
    );

    await expect
      .element(screen.getByRole("button", { name: "Sort: API equivalent" }))
      .toBeInTheDocument();

    await screen.getByRole("button", { name: "Sort ascending" }).click();
    expect(onChange).toHaveBeenCalledWith("cost", "asc");
  });

  it("should label a provider sort instead of falling back to tokens", async () => {
    const screen = await render(
      <UsageSortControl dir="asc" onChange={() => {}} sort="provider" />,
    );

    await expect
      .element(screen.getByRole("button", { name: "Sort: Provider" }))
      .toBeInTheDocument();
  });

  it("should pick a new sort column from the menu", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <UsageSortControl dir="asc" onChange={onChange} sort="tokens" />,
    );

    await screen.getByRole("button", { name: "Sort: Tokens" }).click();
    await screen.getByRole("menuitemradio", { name: "Messages" }).click();

    expect(onChange).toHaveBeenCalledWith("messages", "asc");
  });
});
