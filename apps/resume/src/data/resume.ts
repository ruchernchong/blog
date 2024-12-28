import { DOMAIN_NAME } from "../config";
import type { Resume } from "../types";

export const resume: Resume = {
  baseUrl: `https://resume.${DOMAIN_NAME}`,
  name: "Chong Ru Chern",
  jobDescription: "Frontend Developer",
  about: "Lorem ipsum dolor si ah met",
  experience: [
    {
      name: "DBS Bank",
      location: "Singapore",
      startDate: "Apr 2021",
      description: [
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab deserunt dignissimos dolorem doloribus eius eos error, facere facilis molestias nisi perferendis porro quas quo sit suscipit totam velit veniam voluptates.",
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab deserunt dignissimos dolorem doloribus eius eos error, facere facilis molestias nisi perferendis porro quas quo sit suscipit totam velit veniam voluptates.",
      ],
    },
    {
      name: "Avanade",
      location: "Singapore",
      startDate: "Jan 2021",
      endDate: "Apr 2021",
      description: [
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab deserunt dignissimos dolorem doloribus eius eos error, facere facilis molestias nisi perferendis porro quas quo sit suscipit totam velit veniam voluptates.",
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab deserunt dignissimos dolorem doloribus eius eos error, facere facilis molestias nisi perferendis porro quas quo sit suscipit totam velit veniam voluptates.",
      ],
    },
    {
      name: "Singtel",
      location: "Singapore",
      startDate: "Aug 2018",
      endDate: "Dec 2020",
      description: [
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab deserunt dignissimos dolorem doloribus eius eos error, facere facilis molestias nisi perferendis porro quas quo sit suscipit totam velit veniam voluptates.",
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab deserunt dignissimos dolorem doloribus eius eos error, facere facilis molestias nisi perferendis porro quas quo sit suscipit totam velit veniam voluptates.",
      ],
    },
    {
      name: "Sproud",
      location: "Singapore",
      startDate: "Feb 2017",
      endDate: "Aug 2018",
      description: [
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab deserunt dignissimos dolorem doloribus eius eos error, facere facilis molestias nisi perferendis porro quas quo sit suscipit totam velit veniam voluptates.",
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab deserunt dignissimos dolorem doloribus eius eos error, facere facilis molestias nisi perferendis porro quas quo sit suscipit totam velit veniam voluptates.",
      ],
    },
    {
      name: "The University of Queensland",
      location: "Brisbane, Queensland, Australia",
      startDate: "Feb 2016",
      endDate: "Jun 2016",
      description: [
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab deserunt dignissimos dolorem doloribus eius eos error, facere facilis molestias nisi perferendis porro quas quo sit suscipit totam velit veniam voluptates.",
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab deserunt dignissimos dolorem doloribus eius eos error, facere facilis molestias nisi perferendis porro quas quo sit suscipit totam velit veniam voluptates.",
      ],
    },
  ],
  education: [
    {
      name: "The University of Queensland",
      location: "Brisbane, Queensland, Australia",
      startDate: "Feb 2015",
      endDate: "Aug 2016",
      courseOfStudy: "Bachelor of Information Technology",
    },
    {
      name: "Singapore Polytechnic",
      location: "Singapore",
      startDate: "Apr 2009",
      endDate: "May 2012",
      courseOfStudy: "Diploma in Information Communication Technology",
    },
  ],
  socialMedia: {
    github: "https://github.com/ruchernchong",
    linkedin: "https://linkedin.com/in/ruchernchong/",
    twitter: "https://twitter.com/ruchernchong",
  },
  projects: [],
};
