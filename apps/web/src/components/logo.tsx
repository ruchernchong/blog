import Image from "next/image";

export function Logo({ priority = false }: { priority?: boolean }) {
  return (
    <Image
      src="/icon"
      alt="Logo"
      width={32}
      height={32}
      quality={100}
      priority={priority}
      className="rounded-full"
    />
  );
}
