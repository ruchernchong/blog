import type { SocialMedia } from "@/types";

type Social = {
  name: SocialMedia;
  link: string;
};

const socials: Social[] = [
  { name: "Github", link: "https://github.com/ruchernchong" },
  { name: "Linkedin", link: "https://www.linkedin.com/in/ruchernchong" },
  {
    name: "Stackoverflow",
    link: "https://stackoverflow.com/users/4031163/ru-chern-chong",
  },
  { name: "Twitter", link: "https://twitter.com/ruchernchong" },
  { name: "Bluesky", link: "https://bsky.app/profile/ruchern.dev" },
  { name: "Threads", link: "https://www.threads.net/@ruchernchong" },
];

socials.sort((a, b) => a.name.localeCompare(b.name));

export default socials;
