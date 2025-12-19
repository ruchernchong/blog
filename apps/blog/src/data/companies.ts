import type { Company } from "@/types";

const companies: Company[] = [
  {
    name: "DBS Bank",
    title: "Application Developer",
    logo: "/companies/logo-dbs.svg",
    dateStart: "Apr 2021",
    location: "Singapore",
    url: "https://dbs.com.sg",
    roles: [
      {
        title: "Application Developer (Fullstack)",
        dateStart: "Apr 2021",
      },
    ],
  },
  {
    name: "Singtel",
    title: "Software Engineer",
    logo: "/companies/logo-singtel.svg",
    dateStart: "Aug 2018",
    dateEnd: "Dec 2020",
    location: "Singapore",
    url: "https://shop.singtel.com",
    roles: [
      {
        title: "Software Engineer",
        dateStart: "Aug 2018",
        dateEnd: "Dec 2020",
      },
    ],
  },
  {
    name: "Sproud",
    title: "Software Developer",
    logo: "/companies/logo-sproud.png",
    dateStart: "Feb 2017",
    dateEnd: "Aug 2018",
    location: "Singapore",
    url: "https://sproud.biz",
    roles: [
      {
        title: "Software Developer",
        dateStart: "Feb 2017",
        dateEnd: "Aug 2018",
      },
    ],
  },
  {
    name: "The University of Queensland",
    title: "Teaching Assistant",
    logo: "/companies/logo-uq.svg",
    dateStart: "Feb 2016",
    dateEnd: "Jun 2016",
    location: "Brisbane, Queensland, Australia",
    url: "https://www.eait.uq.edu.au",
    roles: [
      {
        title: "Teaching Assistant",
        dateStart: "Feb 2016",
        dateEnd: "Jun 2016",
      },
    ],
  },
];

export default companies;
