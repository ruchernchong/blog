import { Card } from "@heroui/react";
import { Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Globe } from "@/app/(main)/about/components/globe";

export function LocationCard() {
  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2 font-medium text-base">
          <HugeiconsIcon icon={Location01Icon} size={16} strokeWidth={2} />
          <span>Singapore</span>
        </Card.Title>
      </Card.Header>
      <Card.Content className="flex items-center justify-center">
        <Globe />
      </Card.Content>
    </Card>
  );
}
