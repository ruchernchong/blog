import { HOST_URL } from "@/config";

export type Social = {
  name: string;
  link: string;
};

export const socials: Social[] = [
  {
    name: "Github",
    link: "https://github.com/ruchernchong",
  },
  {
    name: "Linkedin",
    link: "https://www.linkedin.com/in/ruchernchong",
  },
  {
    name: "Stackoverflow",
    link: "https://stackoverflow.com/users/4031163/ru-chern-chong",
  },
  {
    name: "Twitter",
    link: "https://twitter.com/ruchernchong",
  },
  {
    name: "Rss",
    link: `${HOST_URL}/feed.xml`,
  },
];
