import classNames from "classnames";
import {
  SiGithub,
  SiLinkedin,
  SiRss,
  SiStackoverflow,
  SiTwitter,
} from "@icons-pack/react-simple-icons";

const SOCIAL_MAP = {
  Github: SiGithub,
  Linkedin: SiLinkedin,
  Rss: SiRss,
  Stackoverflow: SiStackoverflow,
  Twitter: SiTwitter,
};

type IconProps = {
  name: string;
  className?: string;
};

export const Social = ({ name, className }: IconProps) => {
  const Icon = SOCIAL_MAP[name];

  return <Icon className={classNames(className)} />;
};
