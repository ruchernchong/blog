import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock Next.js headers function to avoid request context errors in tests
vi.mock("next/headers", () => ({
  headers: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(() => "127.0.0.1"),
    }),
  ),
}));

afterEach(() => {
  cleanup();
});
