import { MapPinIcon } from "@heroicons/react/24/outline";
import { Globe } from "@/app/(blog)/about/_components/globe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const LocationCard = () => (
  <Card className="h-full border border-border bg-card">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 font-medium text-base">
        <MapPinIcon className="size-4" />
        <span>Singapore</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="flex items-center justify-center">
      <Globe />
    </CardContent>
  </Card>
);
