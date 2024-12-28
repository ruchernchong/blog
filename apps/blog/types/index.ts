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

export interface Social {
  name: string;
  link: string;
}
