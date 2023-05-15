import { InformationCircleIcon } from "@heroicons/react/20/solid";

const Notification = ({ children }) => {
  if (!children) {
    return null;
  }

  return (
    <div className="bg-neutral-800">
      <div className="mx-auto flex max-w-4xl items-center p-4 text-sm">
        <InformationCircleIcon width={20} height={20} className="mr-2" />
        {children}
      </div>
    </div>
  );
};

export default Notification;
