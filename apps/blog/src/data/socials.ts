import type { SocialMedia } from "@/types";

type Social = {
  name: SocialMedia;
  link: string;
};

const socials: Social[] = [
  { name: "Github", link: "https://github.com/ruchernchong" },
  { name: "Linkedin", link: "https://www.linkedin.com/in/ruchernchong" },
  { name: "Twitter", link: "https://twitter.com/ruchernchong" },
];

socials.sort((a, b) => a.name.localeCompare(b.name));

export default socials;
