import { Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Globe } from "@/app/(main)/about/_components/globe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const LocationCard = () => (
  <Card className="h-full border border-border bg-card">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 font-medium text-base">
        <HugeiconsIcon icon={Location01Icon} size={16} strokeWidth={2} />
        <span>Singapore</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="flex items-center justify-center">
      <Globe />
    </CardContent>
  </Card>
);
