import classNames from "classnames";
import {
  type IconType,
  SiGithub,
  SiLinkedin,
  SiRss,
  SiStackoverflow,
  SiX,
} from "@icons-pack/react-simple-icons";

const SOCIAL_MAP: Record<string, IconType> = {
  Github: SiGithub,
  Linkedin: SiLinkedin,
  RSS: SiRss,
  Stackoverflow: SiStackoverflow,
  Twitter: SiX,
};

type IconProps = {
  name: string;
  className?: string;
};

export const Social = ({ name, className }: IconProps) => {
  const Icon = SOCIAL_MAP[name];
  const title = Object.keys(SOCIAL_MAP).find((item) => item === name)!;

  return <Icon title={title} className={classNames(className)} />;
};
