"use client";

import { useActionState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export type ActionState = { error?: string; success?: string } | undefined;

export function ActionForm({
  action,
  initialState,
  children,
  className,
  submitLabel,
  submitIcon,
}: {
  action: (
    prev: ActionState,
    formData: FormData,
  ) => Promise<ActionState> | ActionState;
  initialState?: ActionState;
  children: ReactNode;
  className?: string;
  submitLabel: string;
  submitIcon?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className={className}>
      {state?.error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
      {state?.success && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.success}</span>
        </div>
      )}
      {children}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-turq px-6 py-3.5 font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Veuillez patienter…" : submitLabel}
        {submitIcon}
      </button>
    </form>
  );
}
