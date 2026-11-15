import type { Project } from "@/types";

const projects: Project[] = [
  {
    name: "MotorMetrics",
    slug: "motormetrics",
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
      "https://motormetrics.app",
      "https://github.com/motormetrics/motormetrics",
    ],
    featured: true,
  },
  {
    name: "SimplyCPF",
    slug: "simplycpf",
    description:
      "CPF, simply explained. Plain-language CPF guides, contribution rates, projections and a developer API for Singapore.",
    skills: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "HeroUI",
      "Fumadocs",
      "Upstash Redis",
      "Vitest",
    ],
    links: [
      "https://simplycpf.com",
      "https://github.com/ruchernchong/simplycpf",
    ],
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
];

export default projects;
