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

type IconProps = {
  name: string;
};

export const Social = ({ name }: IconProps) => {
  return <div className="mr-2">{SOCIAL_MAP[name]}</div>;
};
