// ─── recipe: email-password-auth v1.0.0 — frozen, do not modify ───
import type { InputHTMLAttributes } from 'react';

export function Field({ label, id, ...input }: { label: string; id: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label htmlFor={id} className="block mb-4">
      <span className="block text-sm font-medium mb-1">{label}</span>
      <input
        id={id}
        {...input}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
// ─── @octiq-extend ─── your code below this line ───
