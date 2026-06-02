"use client";

import { Avatar, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
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
        <Avatar className="size-8">
          {session.user.image && (
            <Avatar.Image src={session.user.image} alt={session.user.name} />
          )}
          <Avatar.Fallback>
            {session.user.name?.charAt(0).toUpperCase() ?? "U"}
          </Avatar.Fallback>
        </Avatar>
        <span className="font-medium text-sm">{session.user.name}</span>
      </div>
      <Button variant="outline" size="sm" onPress={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
};
