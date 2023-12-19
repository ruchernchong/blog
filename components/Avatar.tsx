import Image from "next/image";
import avatar from "@/public/images/avatar.jpg";
import avatarHover from "@/public/images/avatar-hover.jpg";

const Avatar = () => {
  return (
    <div className="relative mb-8 w-[80px] grow-0 cursor-pointer sm:w-[176px] md:mb-0">
      <Image
        src={avatar}
        sizes="100vw"
        width={176}
        alt="Photo of Ru Chern Chong"
        className="rounded-full opacity-100 hover:opacity-0"
        priority
      />
      <Image
        src={avatarHover}
        sizes="100vw"
        width={176}
        alt="Photo of Ru Chern Chong"
        className="absolute left-0 top-0 rounded-full opacity-0 hover:opacity-100"
        priority
      />
    </div>
  );
};

export default Avatar;
