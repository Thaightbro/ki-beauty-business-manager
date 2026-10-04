"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function NeueKundin() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [lineId, setLineId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!firstName.trim()) {
      setError("Bitte Vorname eingeben.");
      return;
    }

    setSaving(true);
    setError("");

    const { error: insertError } = await supabase
      .from("Customers")
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        phone: phone.trim() || null,
        line_id: lineId.trim() || null,
      });

    if (insertError) {
      console.error(insertError);
      setError(`Kundin konnte nicht gespeichert werden: ${insertError.message}`);
      setSaving(false);
      return;
    }

    router.push("/termine/neu");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f5f2",
        padding: "40px 6%",
        fontFamily: "Arial, sans-serif",
        color: "#171717",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            color: "#374151",
            textDecoration: "none",
            fontSize: "18px",
          }}
        >
          ← Zurück zum Dashboard
        </Link>

        <div
          style={{
            marginTop: "40px",
            background: "#ffffff",
            border: "1px solid #e5e5e5",
            borderRadius: "24px",
            padding: "48px",
          }}
        >
          <h1
            style={{
              fontSize: "42px",
              margin: "0 0 12px",
              fontWeight: 500,
            }}
          >
            Neue Kundin
          </h1>

          <p
            style={{
              color: "#667085",
              fontSize: "20px",
              marginBottom: "50px",
            }}
          >
            Erfasse eine neue Kundin für KI Beauty.
          </p>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "28px",
              }}
            >
              <Field
                label="Vorname *"
                value={firstName}
                onChange={setFirstName}
                placeholder="Vorname"
                required
              />

              <Field
                label="Nachname"
                value={lastName}
                onChange={setLastName}
                placeholder="Nachname"
              />

              <Field
                label="Telefonnummer"
                value={phone}
                onChange={setPhone}
                placeholder="+66 ..."
                type="tel"
              />

              <Field
                label="LINE ID"
                value={lineId}
                onChange={setLineId}
                placeholder="LINE ID"
              />
            </div>

            {error && (
              <div
                style={{
                  marginTop: "28px",
                  padding: "16px 18px",
                  background: "#fff1f1",
                  border: "1px solid #f0b8b8",
                  borderRadius: "12px",
                  color: "#9b1c1c",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                width: "100%",
                marginTop: "42px",
                padding: "20px",
                border: "none",
                borderRadius: "16px",
                background: saving ? "#777" : "#000",
                color: "#fff",
                fontSize: "20px",
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Wird gespeichert..." : "Kundin speichern"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          fontSize: "18px",
          fontWeight: 700,
          marginBottom: "12px",
        }}
      >
        {label}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "18px 20px",
          fontSize: "18px",
          border: "1px solid #d1d5db",
          borderRadius: "14px",
          outline: "none",
          background: "#fff",
        }}
      />
    </label>
  );
}
