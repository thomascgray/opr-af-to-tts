import { afterEach, beforeEach, vi } from "vitest";

// nanoid ids end up in state and snapshots. A counter keeps them unique (the state
// mutators look models up by id) and predictable. Snapshot helpers mask them anyway,
// so a refactor that changes how many ids get generated doesn't churn the snapshots.
const counter = { value: 0 };
(globalThis as any).__nanoidCounter = counter;

vi.mock("nanoid", () => ({
  nanoid: () => `nanoid-${++(globalThis as any).__nanoidCounter.value}`,
}));

beforeEach(() => {
  counter.value = 0;
  vi.stubGlobal("alert", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});
