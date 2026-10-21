"use client";
/* Small building blocks for the admin panel: big, friendly, phone-first. */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Button({
  children,
  onClick,
  kind = "primary",
  type = "button",
  disabled,
  busy,
  small,
  className,
  href,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "primary" | "secondary" | "danger" | "ghost" | "success";
  type?: "button" | "submit";
  disabled?: boolean;
  busy?: boolean;
  small?: boolean;
  className?: string;
  href?: string;
}) {
  const cls = cx(
    "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    small ? "h-9 px-3 text-[13.5px]" : "h-12 px-5 text-[15px]",
    kind === "primary" && "bg-ak-800 text-white hover:bg-ak-900",
    kind === "success" && "bg-leaf text-white hover:opacity-90",
    kind === "secondary" && "border-2 border-ak-800/25 bg-white text-ak-800 hover:border-ak-800",
    kind === "danger" && "border-2 border-rose/30 bg-white text-rose hover:border-rose",
    kind === "ghost" && "text-ak-800 hover:bg-ak-50",
    className,
  );
  if (href)
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  return (
    <button type={type} onClick={onClick} disabled={disabled || busy} className={cls}>
      {busy ? <Spinner /> : null}
      {children}
    </button>
  );
}

export const Spinner = () => <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />;

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-2xl border border-line bg-white p-4 shadow-[0_1px_0_rgba(23,18,46,0.03)]", className)}>{children}</div>;
}

export function Pill({ children, tone = "grey" }: { children: ReactNode; tone?: "grey" | "green" | "amber" | "purple" | "red" | "blue" }) {
  const t = {
    grey: "bg-[#f1eff6] text-muted",
    green: "bg-[#e3f6ec] text-leaf",
    amber: "bg-marigold-50 text-[#9a5b00]",
    purple: "bg-ak-50 text-ak-800",
    red: "bg-rose-50 text-rose",
    blue: "bg-[#e5f0ff] text-[#1d4ed8]",
  }[tone];
  return <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12.5px] font-bold", t)}>{children}</span>;
}

export function PageTitle({ title, sub, action, back }: { title: string; sub?: string; action?: ReactNode; back?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back && (
          <a href={back} className="mb-1 inline-flex items-center gap-1 text-[14px] font-semibold text-ak-800">
            ← Back
          </a>
        )}
        <h1 className="font-display text-[26px] font-bold leading-tight text-ink">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-[14.5px] text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-10 text-center">
      <span className="text-[40px]" aria-hidden="true">
        {emoji}
      </span>
      <p className="mt-2 text-[16px] font-bold text-ink">{title}</p>
      {children && <div className="mt-1 text-[14px] text-muted">{children}</div>}
    </div>
  );
}

export function Help({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-[13px] leading-snug text-muted">{children}</p>;
}

export const inputCls =
  "w-full rounded-xl border-2 border-line bg-white px-3.5 py-2.5 text-[15.5px] text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-ak-800";

/* ---- toasts ---- */
const ToastCtx = createContext<(msg: string, tone?: "ok" | "error") => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ msg: string; tone: "ok" | "error"; n: number } | null>(null);
  const show = useCallback((msg: string, tone: "ok" | "error" = "ok") => setT({ msg, tone, n: Date.now() }), []);
  useEffect(() => {
    if (!t) return;
    const id = setTimeout(() => setT(null), t.tone === "error" ? 6000 : 3000);
    return () => clearTimeout(id);
  }, [t]);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {t && (
        <div role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4 lg:bottom-8">
          <div className={cx("pointer-events-auto max-w-md rounded-2xl px-5 py-3 text-[15px] font-bold text-white shadow-xl", t.tone === "error" ? "bg-rose" : "bg-ink")}>
            {t.tone === "error" ? "⚠️ " : "✅ "}
            {t.msg}
          </div>
        </div>
      )}
    </ToastCtx.Provider>
  );
}

/* ---- a sheet that slides up on phones, a dialog on computers ---- */
export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 sm:items-center" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl bg-white outline-none sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[18px] font-bold text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full text-[20px] hover:bg-ak-50" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/* ---- "Are you sure?" ---- */
export function useConfirm() {
  const [state, setState] = useState<{ title: string; text: string; yes: string; danger: boolean; resolve: (v: boolean) => void } | null>(null);
  const ask = (title: string, text: string, opts: { yes?: string; danger?: boolean } = {}) =>
    new Promise<boolean>((resolve) => setState({ title, text, yes: opts.yes ?? "Yes", danger: opts.danger ?? false, resolve }));
  const close = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };
  const dialog = (
    <Sheet
      open={Boolean(state)}
      onClose={() => close(false)}
      title={state?.title ?? ""}
      footer={
        <div className="flex gap-2">
          <Button kind="secondary" className="flex-1" onClick={() => close(false)}>
            No, go back
          </Button>
          <Button kind={state?.danger ? "danger" : "primary"} className="flex-1" onClick={() => close(true)}>
            {state?.yes}
          </Button>
        </div>
      }
    >
      <p className="text-[15.5px] text-ink">{state?.text}</p>
    </Sheet>
  );
  return { ask, dialog };
}

export function Toggle({ on, onChange, label, help }: { on: boolean; onChange: (v: boolean) => void; label: string; help?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={cx("relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-leaf" : "bg-[#d6d1e3]")}
      >
        <span className={cx("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left]", on ? "left-[22px]" : "left-0.5")} />
      </button>
      <span>
        <span className="block text-[15px] font-semibold text-ink">{label}</span>
        {help && <span className="block text-[13px] leading-snug text-muted">{help}</span>}
      </span>
    </label>
  );
}
