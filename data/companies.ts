type Company = {
  name: string;
  title: string;
  logo?: string;
  dateStart: string;
  dateEnd?: string;
  location: string;
  url: string;
};

const companies: Company[] = [
  {
    name: "DBS Bank",
    title: "Application Developer",
    logo: "/companies/logo-dbs.svg",
    dateStart: "Apr 2021",
    location: "Singapore",
    url: "https://dbs.com.sg"
  },
  {
    name: "Avanade",
    title: "Analyst, Frontend Development",
    logo: "/companies/logo-avanade.svg",
    dateStart: "Jan 2021",
    dateEnd: "Apr 2021",
    location: "Singapore",
    url: "https://www.avanade.com/zh-sg"
  },
  {
    name: "Singtel",
    title: "Software Engineer",
    logo: "/companies/logo-singtel.svg",
    dateStart: "Aug 2018",
    dateEnd: "Dec 2021",
    location: "Singapore",
    url: "https://shop.singtel.com"
  },
  {
    name: "Sproud",
    title: "Software Developer",
    dateStart: "Feb 2017",
    dateEnd: "Aug 2018",
    location: "Singapore",
    url: "https://sproud.biz"
  },
  {
    name: "The University of Queensland",
    title: "Teaching Assistant",
    logo: "/companies/logo-uq.svg",
    dateStart: "Feb 2016",
    dateEnd: "Jun 2016",
    location: "Brisbane, Queensland, Australia",
    url: "https://www.eait.uq.edu.au"
  }
];

export default companies;
