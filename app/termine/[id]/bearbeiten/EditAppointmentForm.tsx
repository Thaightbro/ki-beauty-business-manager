"use client";

import { useActionState, type ReactNode } from "react";

export default function EditAppointmentForm({ action, children }: {
  action: (state: string, formData: FormData) => Promise<string>;
  children: ReactNode;
}) {
  const [error, formAction, pending] = useActionState(action, "");
  return (
    <form action={formAction}>
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      <fieldset disabled={pending} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
        {children}
      </fieldset>
    </form>
  );
}
