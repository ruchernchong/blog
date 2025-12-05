import type { Project } from "@/types";

const projects: Project[] = [
  {
    name: "SG Cars Trends",
    slug: "sgcarstrends",
    description:
      "Statistics and analytics platform for car trends in Singapore. Data sourced from Land Transport Authority (LTA).",
    coverImage: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=800&fit=crop",
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
    coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop",
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
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=800&fit=crop",
    skills: ["Shell", "TypeScript", "Claude Code", "Codex", "Gemini CLI"],
    links: ["https://github.com/ruchernchong/agentic-slash-commands"],
  },
];

export default projects;
