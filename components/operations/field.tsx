import type {
  InputHTMLAttributes,
  ReactElement,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cloneElement } from "react";

type FieldShellProps = {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly children: ReactElement<{
    readonly "aria-describedby"?: string;
    readonly "aria-invalid"?: boolean;
    readonly "aria-required"?: boolean;
  }>;
};

export function FieldShell({
  id,
  label,
  description,
  error,
  required,
  children,
}: FieldShellProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [
    children.props["aria-describedby"],
    descriptionId,
    errorId,
  ]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(" ") || undefined;
  const control = cloneElement(children, {
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : children.props["aria-invalid"],
    "aria-required": required ? true : children.props["aria-required"],
  });

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-bold uppercase tracking-[0.08em] text-ink"
      >
        {label}
        {required ? <span className="ml-1 text-accent">*</span> : null}
      </label>
      {description ? (
        <p id={descriptionId} className="mt-1 text-xs leading-5 text-muted">
          {description}
        </p>
      ) : null}
      <div className="mt-2">{control}</div>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-2 text-sm font-semibold text-rose-200"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlClassName =
  "min-h-12 w-full border border-white/20 bg-canvas px-3 py-2 text-base text-ink outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-60";

export function TextInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlClassName} ${className}`} {...props} />;
}

export function TextArea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${controlClassName} min-h-32 resize-y ${className}`}
      {...props}
    />
  );
}

export function SelectInput({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${controlClassName} ${className}`} {...props} />;
}
