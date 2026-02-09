import * as React from "react";
import { Link as RouterLink } from "@tanstack/react-router";

type Props = {
  href: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  target?: string;
  rel?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export default function Link({ href, ...rest }: Props) {
  return <RouterLink to={href as any} {...rest} />;
}
