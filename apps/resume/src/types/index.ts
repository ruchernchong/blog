interface Detail {
  name: string;
  location: string;
  startDate: string;
  endDate?: string | undefined;
}

export interface Education extends Detail {
  courseOfStudy: string;
}

export interface Experience extends Detail {
  description: string[];
}

export interface Project {}

export interface Resume {
  baseUrl: string;
  name: string;
  about: string;
  jobDescription: string;
  experience: Experience[];
  education: Education[];
  socialMedia: Record<string, string>;
  projects: Project[];
}
