import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAppointmentTimes } from "@/lib/appointment-time";
import EditAppointmentForm from "./EditAppointmentForm";

export default async function TerminBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data: appointment } = await supabase
    .from("Appointments")
    .select("*")
    .eq("id", id)
    .single();

  if (!appointment) {
    notFound();
  }

  const { data: customers } = await supabase
    .from("Customers")
    .select("*")
    .order("first_name", { ascending: true });

  const { data: services } = await supabase
    .from("Services")
    .select("*")
    .order("name", { ascending: true });

  const start = new Date(appointment.start_time);

  const bangkokDate = start.toLocaleDateString("en-CA", {
    timeZone: "Asia/Bangkok",
  });

  const bangkokTime = start.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  async function updateAppointment(_state: string, formData: FormData): Promise<string> {
    "use server";

    const customerId = formData.get("customer_id");
    const serviceId = formData.get("service_id");
    const date = formData.get("date");
    const time = formData.get("time");
    if (typeof customerId !== "string" || !customerId ||
        typeof serviceId !== "string" || !serviceId ||
        typeof date !== "string" || typeof time !== "string") {
      return "Bitte Kundin, Service, Datum und Uhrzeit angeben.";
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    // Read the selected service again when saving, so its current duration is used.
    const { data: service, error: serviceError } = await supabase
      .from("Services")
      .select("duration")
      .eq("id", serviceId)
      .single();
    if (serviceError || !service) {
      return "Die Behandlungsdauer konnte nicht geladen werden.";
    }
    const times = getAppointmentTimes(date, time, service.duration);
    if (times.error) return times.error;

    const { data: conflicts, error: conflictError } = await supabase
      .from("Appointments")
      .select("id")
      .lt("start_time", times.endTime.toISOString())
      .gt("end_time", times.startTime.toISOString())
      .eq("status", "booked")
      .neq("id", id)
      .limit(1);

    if (conflictError) {
      return "Terminüberschneidung konnte nicht geprüft werden.";
    }
    if (conflicts && conflicts.length > 0) {
      return "Dieser Zeitraum ist bereits belegt. Bitte wähle eine andere Uhrzeit.";
    }

    const { data: updatedAppointment, error } = await supabase
      .from("Appointments")
      .update({
        customer_id: customerId,
        service_id: serviceId,
        start_time: times.startTime.toISOString(),
        end_time: times.endTime.toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !updatedAppointment) {
      return "Termin konnte nicht aktualisiert werden.";
    }
    redirect(`/termine/${id}`);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f5f2",
        fontFamily: "Arial, sans-serif",
        padding: 40,
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
        }}
      >
        <Link
          href={`/termine/${id}`}
          style={{
            color: "#111",
            textDecoration: "none",
          }}
        >
          ← Zurück zum Termin
        </Link>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 18,
            padding: 32,
            marginTop: 24,
          }}
        >
          <h1 style={{ marginTop: 0 }}>Termin bearbeiten</h1>

          <EditAppointmentForm action={updateAppointment}>
            <label style={labelStyle}>
              Kundin
              <select
                name="customer_id"
                defaultValue={appointment.customer_id}
                style={inputStyle}
              >
                {customers?.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name ?? ""}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Service
              <select
                name="service_id"
                defaultValue={appointment.service_id}
                style={inputStyle}
              >
                {services?.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Datum
              <input
                type="date"
                name="date"
                defaultValue={bangkokDate}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Uhrzeit
              <input
                type="time"
                name="time"
                defaultValue={bangkokTime}
                style={inputStyle}
              />
            </label>

            <button
              type="submit"
              style={{
                marginTop: 10,
                padding: "12px 18px",
                border: 0,
                borderRadius: 10,
                background: "#000",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Änderungen speichern
            </button>
          </EditAppointmentForm>
        </div>
      </div>
    </main>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 18,
  fontWeight: 600,
};

const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: 8,
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  boxSizing: "border-box" as const,
  background: "#fff",
};
