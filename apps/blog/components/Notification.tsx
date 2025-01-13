import type { PropsWithChildren } from "react";

const Notification = ({ children }: PropsWithChildren) => {
  if (!children) {
    return null;
  }

  return (
    <div className="bg-gray-800 text-pink-500">
      <div className="container mx-auto flex justify-center p-4 text-sm">
        <div className="bg-gradient-to-r from-pink-500 to-purple-300 bg-clip-text font-extrabold text-transparent">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Notification;
