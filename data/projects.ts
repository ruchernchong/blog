type Project = {
  name: string;
  description: string;
  skills?: string[];
  link: string;
};

const projects: Project[] = [
  {
    name: "Singtel eShop",
    description:
      "Online e-commerce shop for mobile phones and mobile plans for Singapore's largest telecommunication company. Built with React and Gatsby. Hosted on AWS.",
    skills: [
      "gatsby",
      "react",
      "javascript",
      "typescript",
      "styled-components",
      "S3",
      "cloudfront",
    ],
    link: "https://shop.singtel.com",
  },
  {
    name: "CPF Calculator",
    description:
      "An income estimator with CPF contribution following the new changes to the income ceiling announced at the Singapore Budget 2023",
    skills: ["vite", "vitest", "react", "typescript", "tailwind css", "vercel"],
    link: "https://cpf-calculator.vercel.app",
  },
];

export default projects;
