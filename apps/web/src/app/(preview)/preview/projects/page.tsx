import ExternalLink from "@/components/external-link";
import projects from "@/data/projects";

const TILE_GRADIENTS = [
  "from-[oklch(0.82_0.12_255)] to-[oklch(0.58_0.22_255)]",
  "from-[oklch(0.82_0.12_240)] to-[oklch(0.58_0.18_240)]",
  "from-[oklch(0.82_0.08_270)] to-[oklch(0.63_0.14_270)]",
];

export default function PreviewProjectsPage() {
  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="border-border/50 border-b py-16 md:py-24">
        <h1 className="font-semibold text-[clamp(3rem,8vw,6rem)] leading-none tracking-tighter">
          Work.
        </h1>
        <p className="mt-6 max-w-xl text-muted text-xl leading-relaxed">
          A showcase of completed projects and experiments with new
          technologies.
        </p>
      </div>

      {/* Featured projects */}
      {featured.length > 0 && (
        <section className="border-border/50 border-b py-12">
          <h2 className="mb-8 font-semibold text-2xl tracking-tight">
            Featured
          </h2>
          <div className="flex flex-col gap-6">
            {featured.map((project, index) => {
              const liveUrl = project.links[0];
              const githubUrl = project.links[1];
              const gradientClass =
                TILE_GRADIENTS[index % TILE_GRADIENTS.length];
              return (
                <div
                  key={project.slug}
                  className="overflow-hidden rounded-2xl bg-surface shadow-[var(--surface-shadow)] md:flex"
                >
                  <div
                    className={`h-56 bg-gradient-to-br md:h-auto md:w-2/5 ${gradientClass}`}
                  />
                  <div className="flex flex-1 flex-col justify-center p-8 md:p-12">
                    <h3 className="mb-3 font-semibold text-2xl tracking-tight">
                      {project.name}
                    </h3>
                    <p className="mb-4 text-muted leading-relaxed">
                      {project.description}
                    </p>
                    <p className="mb-8 text-muted/60 text-sm">
                      {project.skills.join(" · ")}
                    </p>
                    <div className="flex gap-5">
                      {liveUrl && (
                        <ExternalLink
                          href={liveUrl}
                          className="font-medium text-accent transition-colors hover:underline"
                        >
                          View Live ↗
                        </ExternalLink>
                      )}
                      {githubUrl && (
                        <ExternalLink
                          href={githubUrl}
                          className="text-muted transition-colors hover:text-foreground"
                        >
                          GitHub ↗
                        </ExternalLink>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Other projects */}
      {others.length > 0 && (
        <section className="py-12">
          <h2 className="mb-8 font-semibold text-2xl tracking-tight">
            More Work
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {others.map((project, index) => {
              const liveUrl = project.links[0];
              const githubUrl = project.links[1];
              const gradientClass =
                TILE_GRADIENTS[
                  (featured.length + index) % TILE_GRADIENTS.length
                ];
              return (
                <div
                  key={project.slug}
                  className="overflow-hidden rounded-2xl bg-surface shadow-[var(--surface-shadow)]"
                >
                  <div className={`h-40 bg-gradient-to-br ${gradientClass}`} />
                  <div className="p-7">
                    <h3 className="font-semibold text-lg tracking-tight">
                      {project.name}
                    </h3>
                    <p className="mt-2 mb-3 line-clamp-2 text-muted text-sm leading-relaxed">
                      {project.description}
                    </p>
                    <p className="mb-5 text-muted/60 text-xs">
                      {project.skills.join(" · ")}
                    </p>
                    <div className="flex gap-4">
                      {liveUrl && (
                        <ExternalLink
                          href={liveUrl}
                          className="font-medium text-accent text-sm hover:underline"
                        >
                          Live ↗
                        </ExternalLink>
                      )}
                      {githubUrl && (
                        <ExternalLink
                          href={githubUrl}
                          className="text-muted text-sm transition-colors hover:text-foreground"
                        >
                          GitHub ↗
                        </ExternalLink>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
