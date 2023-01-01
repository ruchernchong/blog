import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Post } from "lib/types";

const BlogPost = ({ title, slug, description, publishedAt }: Post) => (
  <Link href={slug} className="w-full">
    <div className="mb-8 transition hover:opacity-50">
      <h4 className="mb-2 w-full flex-col text-xl font-medium md:flex md:flex-row md:items-center md:justify-between">
        <span>{title}</span>
        <p className="text-sm italic text-neutral-600 dark:text-neutral-400">
          {format(parseISO(publishedAt), "dd MMM yyyy")}
        </p>
      </h4>
      <p className="text-neutral-600 dark:text-neutral-400">{description}</p>
    </div>
  </Link>
);
export default BlogPost;
