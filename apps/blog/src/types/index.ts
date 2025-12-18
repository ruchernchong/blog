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

export type SocialMedia = "Github" | "Linkedin" | "Twitter";

export interface LikesByUser {
  [key: string]: number;
}

export interface PostStats {
  slug: string;
  likesByUser: LikesByUser;
  views: number;
}

export type Likes = {
  totalLikes: number;
  likesByUser: number;
};
