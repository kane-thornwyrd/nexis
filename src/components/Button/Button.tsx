import { type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "default" | "cancel" | "validate";

export type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

export function Button({
  children,
  className,
  type = "button",
  variant = "default",
  ...props
}: ButtonProps) {
  const classes = ["app-button", className].filter(Boolean).join(" ");
  const variantAttribute = variant === "default" ? undefined : variant;

  return (
    <button
      {...props}
      className={classes}
      data-variant={variantAttribute}
      type={type}
    >
      <span className="app-button__content">{children}</span>
    </button>
  );
}
