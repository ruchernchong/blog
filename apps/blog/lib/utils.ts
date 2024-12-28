import { twMerge } from "tailwind-merge";
import classNames, { type Value } from "classnames";

export const cn = (...inputs: Value[]) => twMerge(classNames(inputs));
