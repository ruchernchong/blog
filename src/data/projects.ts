import type { Project } from "@/types";

const projects: Project[] = [
  {
    name: "SG Cars Trends",
    slug: "sgcarstrends",
    description:
      "Statistics and analytics platform for car trends in Singapore. Data sourced from Land Transport Authority (LTA).",
    skills: [
      "Next.js",
      "TypeScript",
      "Hono",
      "SST",
      "AWS Lambda",
      "Neon Postgres",
      "Upstash Redis",
    ],
    links: [
      "https://sgcarstrends.com",
      "https://github.com/sgcarstrends/sgcarstrends",
    ],
    featured: true,
  },
  {
    name: "Is Leap Year",
    slug: "isleapyear",
    description:
      'A satirical "enterprise-grade" leap year detection API built with modern web technologies.',
    skills: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "DaisyUI",
      "Vercel",
    ],
    links: [
      "https://isleapyear.app",
      "https://github.com/ruchernchong/is-leap-year",
    ],
  },
  {
    name: "Agentic Slash Commands",
    slug: "agentic-slash-commands",
    description:
      "Intelligent agentic slash commands for Claude Code, Codex, and Gemini CLI. Smart detection for JS/TS workflows with auto package manager detection.",
    skills: ["Shell", "TypeScript", "Claude Code", "Codex", "Gemini CLI"],
    links: ["https://github.com/ruchernchong/agentic-slash-commands"],
  },
];

export default projects;
