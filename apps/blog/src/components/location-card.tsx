import { MapPinIcon } from "@heroicons/react/24/outline";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { Globe } from "@/components/globe";

export const LocationCard = () => (
  <Card className="h-full border border-zinc-700/50 bg-zinc-900/50 backdrop-blur-sm">
    <CardHeader className="flex gap-2">
      <MapPinIcon className="size-4" />
      <span>Singapore</span>
    </CardHeader>
    <CardBody className="flex items-center justify-center">
      <Globe />
    </CardBody>
  </Card>
);
