import type { PropsWithChildren } from "react";

const Notification = ({ children }: PropsWithChildren) => {
  if (!children) {
    return null;
  }

  return (
    <div className="bg-zinc-800 text-pink-500">
      <div className="mx-auto flex max-w-4xl justify-center p-4 text-sm">
        <div className="bg-gradient-to-r from-pink-500 to-purple-300 bg-clip-text font-extrabold text-transparent">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Notification;
