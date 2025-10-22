import Link from "next/link";
import { Fragment } from "react";
import { getBrowsers } from "@/app/(blog)/actions/analytics/browsers";
import { getCountries } from "@/app/(blog)/actions/analytics/countries";
import { getDevices } from "@/app/(blog)/actions/analytics/devices";
import { getOS } from "@/app/(blog)/actions/analytics/os";
import { getPages } from "@/app/(blog)/actions/analytics/pages";
import { getReferrers } from "@/app/(blog)/actions/analytics/referrers";
import { getVisits } from "@/app/(blog)/actions/analytics/visits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TotalVisitsChart from "./total-visits-chart";

export const dynamic = "force-dynamic";

const fetchAnalytics = async () => {
  try {
    const [browsers, countries, devices, os, pages, referrers, visits] =
      await Promise.all([
        getBrowsers(),
        getCountries(),
        getDevices(),
        getOS(),
        getPages(),
        getReferrers(),
        getVisits(),
      ]);

    return {
      browsers,
      countries,
      devices,
      os,
      pages,
      referrers,
      visits,
    };
  } catch (e) {
    console.error("Failed to fetch analytics data", e);
    throw new Error("Failed to fetch analytics data");
  }
};

const AnalyticsPage = async () => {
  const { browsers, countries, devices, os, pages, referrers, visits } =
    await fetchAnalytics();

  return (
    <div className="grid grid-cols-1 gap-4">
      <TotalVisitsChart data={visits} />
      <Card className="bg-zinc-900 text-zinc-50">
        <CardHeader>
          <CardTitle>Top Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <div className="flex-1 font-bold">Referrer</div>
              <div className="w-20 text-right font-bold">Views</div>
              <div className="w-20 text-right font-bold">%</div>
            </div>
            <hr className="my-2" />
            {referrers.map(({ referrer, count, percent }) => (
              <Fragment key={referrer}>
                <div className="flex gap-1">
                  <div className="relative flex-1 px-2">
                    <div
                      className="absolute inset-0 rounded-sm bg-zinc-600"
                      style={{ width: `${percent}%` }}
                    />
                    <span className="relative">
                      {referrer || "Direct / None"}
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
      <Card className="bg-zinc-900 text-zinc-50">
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <div className="flex-1 font-bold">Page</div>
              <div className="w-20 text-right font-bold">Views</div>
              <div className="w-20 text-right font-bold">%</div>
            </div>
            <hr className="my-2" />
            {pages.map(({ path, count, percent }) => (
              <Fragment key={path}>
                <div className="flex gap-1">
                  <Link
                    href={path}
                    className="relative flex-1 px-2 hover:underline"
                  >
                    <div
                      className="absolute inset-0 rounded-sm bg-zinc-600"
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
      <Card className="bg-zinc-900 text-zinc-50">
        <CardHeader>
          <CardTitle>Top Countries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <div className="flex-1 font-bold">Country</div>
              <div className="w-20 text-right font-bold">Views</div>
              <div className="w-20 text-right font-bold">%</div>
            </div>
            <hr className="my-2" />
            {countries.map(({ country, flag, count, percent }) => (
              <Fragment key={country}>
                <div className="flex gap-1">
                  <div className="relative flex-1 px-2">
                    <div
                      className="absolute inset-0 rounded-sm bg-zinc-600"
                      style={{ width: `${percent}%` }}
                    />
                    <span className="relative">
                      {flag} {country}
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
      <Card className="bg-zinc-900 text-zinc-50">
        <CardHeader>
          <CardTitle>Top OS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <div className="flex-1 font-bold">OS</div>
              <div className="w-20 text-right font-bold">Views</div>
              <div className="w-20 text-right font-bold">%</div>
            </div>
            <hr className="my-2" />
            {os.map(({ os, count, percent }) => (
              <Fragment key={os}>
                <div className="flex gap-1">
                  <div className="relative flex-1 px-2">
                    <div
                      className="absolute inset-0 rounded-sm bg-zinc-600"
                      style={{ width: `${percent}%` }}
                    />
                    <span className="relative">{os}</span>
                  </div>
                  <div className="w-20 text-right">{count}</div>
                  <div className="w-20 text-right">{percent}</div>
                </div>
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-zinc-900 text-zinc-50">
        <CardHeader>
          <CardTitle>Top Browsers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <div className="flex-1 font-bold">Browser</div>
              <div className="w-20 text-right font-bold">Views</div>
              <div className="w-20 text-right font-bold">%</div>
            </div>
            <hr className="my-2" />
            {browsers.map(({ browser, count, percent }) => (
              <Fragment key={browser}>
                <div className="flex gap-1">
                  <div className="relative flex-1 px-2">
                    <div
                      className="absolute inset-0 rounded-sm bg-zinc-600"
                      style={{ width: `${percent}%` }}
                    />
                    <span className="relative">{browser}</span>
                  </div>
                  <div className="w-20 text-right">{count}</div>
                  <div className="w-20 text-right">{percent}</div>
                </div>
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-zinc-900 text-zinc-50">
        <CardHeader>
          <CardTitle>Top Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <div className="flex-1 font-bold">Device</div>
              <div className="w-20 text-right font-bold">Views</div>
              <div className="w-20 text-right font-bold">%</div>
            </div>
            <hr className="my-2" />
            {devices.map(({ device, count, percent }) => (
              <Fragment key={device}>
                <div className="flex gap-1">
                  <div className="relative flex-1 px-2">
                    <div
                      className="absolute inset-0 rounded-sm bg-zinc-600"
                      style={{ width: `${percent}%` }}
                    />
                    <span className="relative">{device}</span>
                  </div>
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
