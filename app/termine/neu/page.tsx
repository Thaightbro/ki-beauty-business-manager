"use client";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createAppointment } from "./actions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Customer = {
  id: number;
  first_name: string;
  last_name: string | null;
  phone: string | null;
};

type Service = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  duration: number;
};

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<p>Terminformular wird geladen…</p>}>
      <NewAppointmentForm />
    </Suspense>
  );
}

function NewAppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();


  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(() => searchParams.get("date") ?? "");
  const [time, setTime] = useState(() => searchParams.get("time") ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data: customerData } = await supabase
        .from("Customers")
        .select("id, first_name, last_name, phone")
        .order("first_name");

      const { data: serviceData } = await supabase
        .from("Services")
        .select("id, name, description, price, duration")
        .eq("active", true)
        .order("id");

      setCustomers(customerData ?? []);
      setServices(serviceData ?? []);
    }

    loadData();
  }, []);

  const selectedService = services.find(
    (service) => String(service.id) === serviceId
  );

  const formComplete =
    customerId !== "" &&
    serviceId !== "" &&
    date !== "" &&
    time !== "" &&
    selectedService !== undefined;

  async function saveAppointment() {
    if (!formComplete || !selectedService) return;

    setSaving(true);
    setError("");

    const formData = new FormData();
    formData.set("customer_id", customerId);
    formData.set("service_id", serviceId);
    formData.set("date", date);
    formData.set("time", time);

    try {
      const saveError = await createAppointment(formData);
      if (saveError) {
        setError(saveError);
        setSaving(false);
        return;
      }
    } catch {
      setError("Termin konnte nicht gespeichert werden. Bitte versuche es erneut.");
      setSaving(false);
      return;
    }

    router.push(`/wochenuebersicht?week=${date}`);
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f5f2",
        fontFamily: "Arial, sans-serif",
        padding: "50px 20px",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link
          href="/termine"
          style={{
            color: "#555",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: 25,
          }}
        >
          ← Zurück zu Termine
        </Link>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 18,
            padding: 35,
          }}
        >
          <h1 style={{ marginTop: 0, fontSize: 34 }}>Neuer Termin</h1>

          <p style={{ color: "#6b7280", marginBottom: 35 }}>
            Erstelle einen neuen Termin für KI Beauty.
          </p>

          <label style={labelStyle}>Kundin</label>

          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            style={inputStyle}
          >
            <option value="">Kundin auswählen</option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.first_name} {customer.last_name ?? ""}
              </option>
            ))}
          </select>

          {customers.length === 0 && (
            <div
              style={{
                background: "#f7f5f2",
                padding: 16,
                borderRadius: 10,
                marginBottom: 25,
              }}
            >
              Noch keine Kundinnen vorhanden.
            </div>
          )}

          <label style={labelStyle}>Behandlung</label>

          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            style={inputStyle}
          >
            <option value="">Service auswählen</option>

            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} – {service.price.toLocaleString()} THB
              </option>
            ))}
          </select>

          {selectedService && (
            <div
              style={{
                background: "#f7f5f2",
                borderRadius: 12,
                padding: 18,
                marginBottom: 25,
              }}
            >
              <strong>{selectedService.name}</strong>

              {selectedService.description && (
                <div style={{ color: "#6b7280", marginTop: 6 }}>
                  {selectedService.description}
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <strong>
                  {selectedService.price.toLocaleString()} THB
                </strong>
                {" · "}
                {selectedService.duration} Minuten
              </div>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
            }}
          >
            <div>
              <label style={labelStyle}>Datum</label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Uhrzeit</label>

              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                padding: 14,
                borderRadius: 10,
                marginBottom: 15,
              }}
            >
              {error}
            </div>
          )}

<button
  type="button"
  onClick={saveAppointment}
  disabled={saving || !customerId || !serviceId || !date || !time}
  style={{
              width: "100%",
              marginTop: 15,
              padding: 16,
              border: "none",
              borderRadius: 10,
              background: formComplete && !saving ? "#000" : "#aaa",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: formComplete && !saving ? "pointer" : "not-allowed",
            }}
          >
            {saving ? "Wird gespeichert..." : "Termin speichern"}
          </button>
        </div>
      </div>
    </main>
  );
}

const labelStyle = {
  display: "block",
  fontWeight: 600,
  marginBottom: 8,
};

const inputStyle = {
  width: "100%",
  padding: "14px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  fontSize: "16px",
  marginBottom: "25px",
  background: "#fff",
  boxSizing: "border-box" as const,
};
