"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const UserMenu = () => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  if (isPending || !session) {
    return <div className="size-8" />;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        {session.user.image && (
          <Image
            src={session.user.image}
            alt={session.user.name}
            width={32}
            height={32}
            className="size-8 rounded-full"
          />
        )}
        <span className="font-medium text-sm">{session.user.name}</span>
      </div>
      <Button variant="outline" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
};
