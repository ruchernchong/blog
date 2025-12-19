import { Briefcase01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import ExternalLink from "@/components/shared/external-link";
import { Typography } from "@/components/typography";
import type { Company } from "@/types";
import { TimelineThread } from "./timeline-thread";

interface EmploymentProps {
  companies: Company[];
}

const Employment = ({ companies }: EmploymentProps) => {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <HugeiconsIcon
              icon={Briefcase01Icon}
              size={20}
              className="text-primary"
            />
          </div>
          <Typography variant="h2">Career</Typography>
        </div>
        <Typography variant="body" className="text-muted-foreground">
          Some cool companies I have worked with. Feel free to connect with me
          on{" "}
          <ExternalLink
            href="https://linkedin.com/in/ruchernchong"
            className="text-primary underline decoration-primary/30 underline-offset-4 transition-colors duration-200 hover:decoration-primary"
          >
            LinkedIn
          </ExternalLink>
          .
        </Typography>
      </div>

      <TimelineThread companies={companies} />
    </section>
  );
};

export default Employment;
