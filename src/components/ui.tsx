import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import type { Tone } from "@/lib/status";
import { formatBytes } from "@/lib/format";
import { SearchIcon } from "./icons";

export function StatCard({ value, label, tone }: { value: number | string; label: string; tone: Tone }) {
  return (
    <div className={`stat tone-${tone}`}>
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

export function Chip({ tone, children, square }: { tone: Tone; children: ReactNode; square?: boolean }) {
  return <span className={`chip tone-${tone}${square ? " chip--square" : ""}`}>{children}</span>;
}

export function PageHeader({
  title,
  sub,
  aside,
}: {
  title: string;
  sub?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {sub ? <div className="page-sub">{sub}</div> : null}
      </div>
      {aside ? <div className="page-head__aside">{aside}</div> : null}
    </div>
  );
}

/** "Task: GP-1042 | Mouza: Chak 42" style subtitle. */
export function MetaLine({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <>
      {items.map(([label, value], i) => (
        <span key={label} style={{ display: "contents" }}>
          {i > 0 ? <span className="page-sub__sep">|</span> : null}
          <span>
            {label}: {value}
          </span>
        </span>
      ))}
    </>
  );
}

export function Card({
  title,
  accent,
  divider,
  className = "",
  bodyClassName = "card__body",
  children,
}: {
  title?: ReactNode;
  accent?: Tone | "primary";
  divider?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  const accentVar = accent
    ? ({ "--accent": accent === "primary" ? "var(--primary)" : `var(--${accent}-accent)` } as CSSProperties)
    : undefined;
  return (
    <section className={`card ${className}`}>
      {title ? (
        <h2
          className={`card__title${accent ? " card__title--accent" : ""}${divider ? " card__title--divider" : ""}`}
          style={accentVar}
        >
          {title}
        </h2>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="loading">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty__title">{title}</div>
      {children}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="banner tone-danger" role="alert" style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry ? (
        <button type="button" className="btn btn--outline btn--sm" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search">
      <span className="visually-hidden">{placeholder}</span>
      <SearchIcon className="search__icon" />
      <input className="input" type="search" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  label = "Status",
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  label?: string;
}) {
  return (
    <label className="toolbar__filter">
      <span className="field__label">{label}</span>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All statuses</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

/** File input rendered like the Figma "file pill" rows. */
export function FilePicker({
  files,
  onChange,
  multiple,
  accept,
  placeholder = "No file selected",
  buttonLabel = "Add file",
}: {
  files: File[];
  onChange: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  placeholder?: string;
  buttonLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="stack" style={{ gap: 8 }}>
      {files.map((file, i) => (
        <div className="file-pill" key={`${file.name}-${i}`}>
          <span>
            {file.name} {file.size ? <span className="muted">({formatBytes(file.size)})</span> : null}
          </span>
          <button
            type="button"
            className="file-pill__remove"
            aria-label={`Remove ${file.name}`}
            onClick={() => onChange(files.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>
      ))}
      {files.length === 0 || multiple ? (
        <div className="file-pill">
          <span className="muted">{files.length === 0 ? placeholder : "Add another file"}</span>
          <button type="button" className="btn btn--outline btn--sm" onClick={() => inputRef.current?.click()}>
            {buttonLabel}
          </button>
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple={multiple}
        accept={accept}
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []);
          if (picked.length) onChange(multiple ? [...files, ...picked] : picked.slice(0, 1));
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  busy,
  requireText,
  textLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  requireText?: boolean;
  textLabel?: string;
  onConfirm: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (open) setText("");
  }, [open]);
  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="dialog__title">{title}</div>
        {children ? <div className="dialog__body">{children}</div> : null}
        {requireText ? (
          <Field label={textLabel ?? "Reason"} required>
            <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
          </Field>
        ) : null}
        <div className="actions-end mt-24">
          <button type="button" className="btn btn--outline" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onConfirm(text.trim())}
            disabled={busy || (requireText && !text.trim())}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
