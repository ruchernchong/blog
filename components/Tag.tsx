import classNames from "classnames";

const Tag = (props) => {
  const isSelected = props.isSelected;

  return (
    <button
      type="button"
      className={classNames(
        "rounded-full border border-blue-600 bg-white px-4 py-2 pl-8 text-center text-base font-medium text-blue-700 before:absolute before:-ml-4 before:content-['#'] hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-300 dark:border-blue-500 dark:bg-neutral-900 dark:text-blue-500 dark:hover:bg-blue-500 dark:hover:text-white dark:focus:ring-blue-800",
        {
          "bg-blue-700 text-white dark:bg-blue-500 dark:text-white": isSelected,
        }
      )}
      {...props}
    />
  );
};

export default Tag;
