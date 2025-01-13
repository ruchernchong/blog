import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getReferrers } from "@/app/actions/referrers";
import React, { Fragment } from "react";
import { getPages } from "@/app/actions/pages";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";

const AnalyticsPage = async () => {
  const referrers = await getReferrers();
  const pages = await getPages();

  return (
    <div className="grid gap-4">
      <Card className="bg-gray-900 text-gray-50">
        <CardHeader>
          <CardTitle>Top Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <div className="flex-1 font-bold">Referrers</div>
              <div className="w-20 text-right font-bold">Views</div>
              <div className="w-20 text-right font-bold">%</div>
            </div>
            {referrers.map(({ referrer, count, percent }) => (
              <Fragment key={referrer}>
                <div className="flex gap-1">
                  <div className="relative flex-1 px-2">
                    <div
                      className="absolute inset-0 rounded-sm bg-gray-600"
                      style={{ width: `${percent}%` }}
                    />
                    <span className="relative flex items-center gap-2">
                      {referrer || "Direct / None"}{" "}
                      {referrer && <ExternalLinkIcon className="h-4 w-4" />}
                    </span>
                  </div>
                  <div className="w-20 text-right">{count}</div>
                  <div className="w-20 text-right">{percent}</div>
                </div>
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gray-900 text-gray-50">
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <div className="flex-1 font-bold">Pages</div>
              <div className="w-20 text-right font-bold">Views</div>
              <div className="w-20 text-right font-bold">%</div>
            </div>
            {pages.map(({ path, count, percent }) => (
              <Fragment key={path}>
                <div className="flex gap-1">
                  <Link
                    href={path}
                    className="relative flex-1 px-2 hover:underline"
                  >
                    <div
                      className="absolute inset-0 rounded-sm bg-gray-600"
                      style={{ width: `${percent}%` }}
                    />
                    <span className="relative">{path}</span>
                  </Link>
                  <div className="w-20 text-right">{count}</div>
                  <div className="w-20 text-right">{percent}</div>
                </div>
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
