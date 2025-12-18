import type { PropsWithChildren } from "react";

const Notification = ({ children }: PropsWithChildren) => {
  if (!children) {
    return null;
  }

  return (
    <div className="bg-muted text-foreground">
      <div className="mx-auto flex max-w-4xl justify-center p-4 text-sm">
        <div className="font-extrabold">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Notification;
