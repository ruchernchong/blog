import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/card";

interface ReferrersProps {
  data: {
    referrer: string | null;
    count: number;
    percent: number;
  }[];
}

export const Referrers = ({ data }: ReferrersProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Sources</CardTitle>
      </CardHeader>
      <CardContent>
        {data.map(({ referrer, count }) => (
          <div
            key={referrer}
            className="flex justify-between border-neutral-600 border-b py-2 last-of-type:border-none"
          >
            <span>{referrer || "Direct / None"}</span>
            <span>x{count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
