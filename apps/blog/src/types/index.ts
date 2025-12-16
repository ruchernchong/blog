import type { Route } from "next";

export interface Company {
  name: string;
  title: string;
  logo: string;
  dateStart: string;
  dateEnd?: string;
  location: string;
  url: string;
}

export interface Project {
  name: string;
  slug: string;
  coverImage?: string;
  description?: string;
  skills: string[];
  links: Route[];
  previewImage?: string;
  featured?: boolean;
}

export type SocialMedia =
  | "Github"
  | "Linkedin"
  | "Stackoverflow"
  | "Twitter"
  | "Bluesky"
  | "Threads";

