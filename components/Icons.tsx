import {
  Github as SiGithub,
  Linkedin as SiLinkedin,
  Rss as SiRss,
  Stackoverflow as SiStackoverflow,
  Twitter as SiTwitter,
} from "@icons-pack/react-simple-icons";

const SOCIAL_MAP: Record<string, any> = {
  Github: <SiGithub />,
  Linkedin: <SiLinkedin />,
  Rss: <SiRss />,
  Stackoverflow: <SiStackoverflow />,
  Twitter: <SiTwitter />,
};

export const Social = ({ name }) => {
  return (
    <div className="mr-2 h-6 w-6 dark:fill-neutral-400">{SOCIAL_MAP[name]}</div>
  );
};
