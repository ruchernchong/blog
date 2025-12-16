"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../../../../convex/_generated/api";

interface Props {
  slug: string;
}

export const ViewCounter = ({ slug }: Props) => {
  const count = useQuery(api.views.get, { slug });
  const increment = useMutation(api.views.increment);
  const hasIncremented = useRef(false);

  useEffect(() => {
    if (!hasIncremented.current) {
      hasIncremented.current = true;
      increment({ slug });
    }
  }, [slug, increment]);

  return (
    <div className="text-neutral-400 text-sm">
      {count?.toLocaleString() ?? "–"}
    </div>
  );
};
