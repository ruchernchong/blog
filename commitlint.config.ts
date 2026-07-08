import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  parserPreset: {
    presetConfig: {
      types: [
        { type: "feat", section: "Features" },
        { type: "fix", section: "Bug Fixes" },
        { type: "perf", section: "Performance Improvements" },
        { type: "revert", section: "Reverts" },
        { type: "docs", section: "Documentation" },
        { type: "style", section: "Styles" },
        { type: "refactor", section: "Code Refactoring" },
        { type: "test", section: "Tests" },
        { type: "build", section: "Build System" },
        { type: "ci", section: "Continuous Integration" },
        { type: "chore", section: "Maintenance", hidden: true },
      ],
    },
  },
  rules: {
    "header-max-length": [2, "always", 72],
    "scope-empty": [2, "always"],
    "subject-case": [
      2,
      "never",
      ["sentence-case", "start-case", "pascal-case", "upper-case"],
    ],
  },
};
export default config;
