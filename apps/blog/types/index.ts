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
  description?: string;
  skills: string[];
  links: string[];
}

export type SocialMedia =
  | "Github"
  | "Linkedin"
  | "Stackoverflow"
  | "Twitter"
  | "Bluesky"
  | "Threads";

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
  totalLikesByUser: number;
};