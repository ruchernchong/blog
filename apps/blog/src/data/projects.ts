import type { Project } from "@/types";

const projects: Project[] = [
  {
    name: "Singtel eShop",
    slug: "singtel-eshop",
    coverImage: "/projects/singtel-eshop.png",
    description:
      "Online e-commerce shop for mobile phones and mobile plans for Singapore's largest telecommunication company. Built with React and Gatsby. Hosted on AWS.",
    skills: [
      "Gatsby",
      "React",
      "TypeScript",
      "Styled Components",
      "AWS S3",
      "AWS CloudFront",
    ],
    links: ["https://shop.singtel.com"],
  },
  {
    name: "Singapore Motor Trends",
    slug: "singapore-motor-trends",
    description:
      "Statistics for car trends in Singapore. Data provided by Land Transport Authority (LTA)",
    skills: ["next.js", "typescript", "react", "tailwind css", "sst", "aws"],
    links: ["https://sgmotortrends.com", "https://api.sgmotortrends.com"],
  },
  {
    name: "CPF Contribution Calculator",
    slug: "cpf-contribution-calculator",
    description:
      "A calculator to compute CPF contributions after the 2023 income ceiling changes following Ministry of Finance announcement at the Singapore Budget 2023",
    skills: [
      "next.js",
      "typescript",
      "react",
      "redux",
      "shadcn/ui",
      "tailwind css",
    ],
    links: ["https://cpf-contribution-calculator.ruchern.dev"],
  },
];

export default projects;
