import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Post } from "lib/types";

const BlogPost = ({ title, slug, excerpt, date }: Post) => {
  const formattedDate = format(parseISO(date), "dd MMM yyyy");

  return (
    <Link href={slug} className="w-full">
      <div className="mb-8 transition hover:opacity-50">
        <h4 className="mb-2 w-full flex-col text-xl font-medium md:flex md:flex-row md:items-center md:justify-between">
          <span>{title}</span>
          <time
            dateTime={formattedDate}
            title={formattedDate}
            className="text-sm italic text-neutral-600 dark:text-neutral-400"
          >
            {formattedDate}
          </time>
        </h4>
        <p className="text-neutral-600 dark:text-neutral-400">{excerpt}</p>
      </div>
    </Link>
  );
};
export default BlogPost;
