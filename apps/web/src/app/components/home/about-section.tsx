import { HomeStats } from "./home-stats";

export function AboutSection() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-semibold text-xl tracking-tight">About</h2>
      <p className="text-muted text-sm leading-relaxed">
        I'm a Software Engineer from Singapore, currently an Application
        Developer (Fullstack) at DBS Bank. I like automating workflows and
        building for the web with React, Node, and TypeScript. I track
        everything, from LTA car registrations to my own Claude token usage.
      </p>
      <HomeStats />
    </section>
  );
}
