import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { trpc } from "@/trpc/client";
import { Loader } from "@/components/shared/loader";

export const Referrers = () => {
  const { data = [], isLoading } = trpc.analytics.getReferrers.useQuery();
  console.log(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Sources</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader />
        ) : (
          data.map(({ referrer, count }) => (
            <div
              key={referrer}
              className="flex justify-between border-neutral-600 border-b py-2 last-of-type:border-none"
            >
              <span>{referrer || "Direct / None"}</span>
              <span>x{count}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
