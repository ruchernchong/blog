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
    name: "Claude Kit",
    slug: "claude-kit",
    coverImage: "/images/projects/claude-kit.png",
    description:
      "A collection of powertools for Claude Code including specialised agents, slash commands, and skills.",
    skills: ["Shell", "TypeScript", "Claude Code"],
    links: ["https://github.com/ruchernchong/claude-kit"],
  },
];

export default projects;
