export type Link = string;

export interface Company {
  name: string;
  title: string;
  logo: string;
  dateStart: `${string} ${number}` | string;
  dateEnd?: `${string} ${number}` | string;
  location: string;
  url: Link;
}

export type Skill = string;
export interface Project {
  name: string;
  description?: string;
  skills: Skill[];
  links: Link[];
}

export interface Social {
  name: string;
  link: Link;
}
