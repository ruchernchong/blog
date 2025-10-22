"use client";

import { Button, Chip, Link } from "@heroui/react";
import { ExternalLinkIcon } from "lucide-react";
import Image from "next/image";
import type { Project } from "@/types";

type Props = {
  project: Project;
};

export const ProjectDetail = ({ project }: Props) => {
  const { coverImage, description, skills, links } = project;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        {links.map((link) => (
          <Button
            key={link}
            as={Link}
            href={link}
            isExternal
            radius="lg"
            color="default"
            variant="ghost"
            startContent={<ExternalLinkIcon size={16} />}
          >
            {link}
          </Button>
        ))}
      </div>
      {coverImage && (
        <div className="relative aspect-video overflow-hidden rounded-lg">
          <Image
            src={coverImage}
            alt={`${project.name} cover image`}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div>
        {description && (
          <p className="text-lg text-zinc-300 leading-relaxed">{description}</p>
        )}
      </div>

      {skills.length > 0 && (
        <>
          <h3 className="mb-3 font-semibold text-sm text-zinc-400 uppercase tracking-wider">
            Technologies
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Chip key={skill}>{skill}</Chip>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
