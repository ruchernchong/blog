import Icon from "@/app/icon.png";
import ExternalLink from "@/components/ExternalLink";
import * as Icons from "@/components/Icons";
import { navLinks } from "@/config";
import socials from "@/data/socials";
import Image from "next/image";
import Link from "next/link";

const Footer = () => (
  <footer className="bg-zinc-800 py-8" data-umami-event="footer-interaction">
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-y-4 px-4">
      <div className="flex flex-col gap-y-4 md:flex-row md:justify-between">
        <div className="flex flex-col" data-umami-event="footer-logo-view">
          <Image src={Icon} width={64} height={64} alt="Site logo" />
        </div>
        <div className="flex gap-x-16 md:basis-1/3 md:justify-between">
          <div
            className="flex flex-col gap-4"
            data-umami-event="footer-nav-interaction"
          >
            <Link
              href="/"
              data-umami-event="footer-nav-click"
              data-umami-event-title="Home"
              data-umami-event-url="/"
            >
              Home
            </Link>
            {navLinks.map(({ href, title }) => {
              return (
                <Link
                  key={title}
                  href={href}
                  data-umami-event="footer-nav-click"
                  data-umami-event-title={title}
                  data-umami-event-url={href}
                >
                  {title}
                </Link>
              );
            })}
          </div>
          <div
            className="flex flex-col gap-4"
            data-umami-event="footer-social-links-interaction"
          >
            {socials.map(({ name, link }) => (
              <div key={name}>
                <ExternalLink
                  href={link}
                  className="hover:text-pink-500"
                  title={name}
                >
                  <div className="inline-flex items-center gap-x-2 md:flex">
                    <Icons.Social name={name} className="h-4 w-4" />
                    {name}
                  </div>
                </ExternalLink>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div data-umami-event="footer-copyright-view">
        &copy; {new Date().getFullYear()} Chong Ru Chern. All Rights Reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
