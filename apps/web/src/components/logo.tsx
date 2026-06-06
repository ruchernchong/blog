import Image from "next/image";

interface LogoProps {
  priority?: boolean;
}

export function Logo({ priority = false }: LogoProps) {
  return (
    <Image
      src="/icon"
      alt="Logo"
      width={32}
      height={32}
      priority={priority}
      quality={100}
      className="rounded-full"
    />
  );
}
