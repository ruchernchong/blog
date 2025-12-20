import Image from "next/image";

export function Logo() {
  return (
    <Image
      src="/icon"
      alt="Logo"
      width={32}
      height={32}
      quality={100}
      className="rounded-full"
    />
  );
}
