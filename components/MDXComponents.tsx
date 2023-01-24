import Image from "next/image";
const ImageComponent = (props) => (
  <Image
    width={0}
    height={0}
    sizes="100vw"
    className="rounded-lg w-auto h-auto"
    {...props}
  />
);

const MDXComponents = {
  img: ImageComponent
};

export default MDXComponents;
