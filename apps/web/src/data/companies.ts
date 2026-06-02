import type { Company } from "@/types";

type SingleRoleCompany = Omit<Company, "roles"> & {
  roleTitle?: string;
};

const withSingleRole = ({
  roleTitle,
  ...company
}: SingleRoleCompany): Company => ({
  ...company,
  roles: [
    {
      title: roleTitle ?? company.title,
      dateStart: company.dateStart,
      dateEnd: company.dateEnd,
    },
  ],
});

const companies: Company[] = [
  withSingleRole({
    name: "DBS Bank",
    title: "Application Developer",
    logo: "/companies/logo-dbs.svg",
    dateStart: "Apr 2021",
    location: "Singapore",
    url: "https://dbs.com.sg",
    roleTitle: "Application Developer (Fullstack)",
  }),
  withSingleRole({
    name: "Singtel",
    title: "Software Engineer",
    logo: "/companies/logo-singtel.svg",
    dateStart: "Aug 2018",
    dateEnd: "Dec 2020",
    location: "Singapore",
    url: "https://shop.singtel.com",
  }),
  withSingleRole({
    name: "Sproud",
    title: "Software Developer",
    logo: "/companies/logo-sproud.png",
    dateStart: "Feb 2017",
    dateEnd: "Aug 2018",
    location: "Singapore",
    url: "https://sproud.biz",
  }),
  withSingleRole({
    name: "The University of Queensland",
    title: "Teaching Assistant",
    logo: "/companies/logo-uq.svg",
    dateStart: "Feb 2016",
    dateEnd: "Jun 2016",
    location: "Brisbane, Queensland, Australia",
    url: "https://www.eait.uq.edu.au",
  }),
];

export default companies;
