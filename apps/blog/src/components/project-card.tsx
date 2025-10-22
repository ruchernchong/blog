"use client";

import { Chip } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { type MouseEvent, useRef, useState } from "react";
import type { Project } from "@/types";

interface Props {
  project: Project;
}

const ProjectCard = ({ project }: Props) => {
  const { name, slug, description, skills, coverImage } = project;
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <Link href={`/projects/${slug}`}>
      <div
        ref={cardRef}
        className="group relative cursor-pointer overflow-hidden rounded-xl border border-foreground/10 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 transition-all hover:border-foreground/20 hover:shadow-lg"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Spotlight effect */}
        <div
          className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(circle 150px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)`,
          }}
        />

        {/* Thumbnail */}
        <div className="relative aspect-video w-full bg-zinc-800">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={`${name} cover`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="font-bold text-2xl text-white/60">{name}</div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 p-6">
          <div className="mb-4">
            <h3 className="mb-2 font-bold text-white text-xl">{name}</h3>
            <p className="line-clamp-1 text-sm text-zinc-400">{description}</p>
          </div>

          <div className="flex gap-2 overflow-x-hidden">
            {skills.map((skill) => (
              <Chip key={skill} size="sm" variant="bordered">
                {skill}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
