import Link from "next/link";
import { format, formatISO, parseISO } from "date-fns";
import { Post } from "lib/types";

const BlogPost = ({ title, slug, excerpt, publishedDate }: Post) => {
  const formattedDate = format(parseISO(publishedDate), "dd MMM yyyy");

  return (
    <div className="mb-8 w-full">
      <div className="flex-col md:flex md:flex-row md:items-center md:justify-between">
        <Link href={slug} className="transition hover:opacity-50">
          <h3 className="text-xl font-medium">{title}</h3>
        </Link>
        <time
          dateTime={formatISO(parseISO(publishedDate))}
          title={formattedDate}
          className="italic text-neutral-600 dark:text-neutral-400"
        >
          {formattedDate}
        </time>
      </div>
      <p className="text-neutral-600 dark:text-neutral-400">{excerpt}</p>
    </div>
  );
};
export default BlogPost;
