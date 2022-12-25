import Link from "next/link";
import { Post } from "lib/types";

export default function BlogPost({ description, slug, title }: Post) {
  return (
    <Link href={slug} className="w-full">
      <div className="mb-8 w-full transition hover:opacity-50 ">
        <h4 className="mb-2 w-full text-lg font-medium">{title}</h4>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </Link>
  );
}
