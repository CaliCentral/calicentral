import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type ContainerProps<T extends ElementType = "div"> = {
  readonly as?: T;
  readonly children: ReactNode;
  readonly className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function Container<T extends ElementType = "div">({
  as,
  children,
  className = "",
  ...props
}: ContainerProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      className={`mx-auto w-full max-w-[86rem] px-5 sm:px-8 lg:px-10 xl:px-14 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
