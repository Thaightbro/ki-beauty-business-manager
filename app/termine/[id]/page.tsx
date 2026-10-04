import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DeleteAppointmentButton from "./DeleteAppointmentButton";

export default async function TerminDetailPage({
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

  const { data: customer } = await supabase
    .from("Customers")
    .select("*")
    .eq("id", appointment.customer_id)
    .single();

  const { data: service } = await supabase
    .from("Services")
    .select("*")
    .eq("id", appointment.service_id)
    .single();

  const start = new Date(appointment.start_time);

  const date = start.toLocaleDateString("de-CH", {
    timeZone: "Asia/Bangkok",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const time = start.toLocaleTimeString("de-CH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
  });
  async function deleteAppointment() {
  "use server";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { error } = await supabase
    .from("Appointments")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  const appointmentDate = new Date(appointment.start_time).toLocaleDateString(
  "en-CA",
  {
    timeZone: "Asia/Bangkok",
  }
);

redirect(`/wochenuebersicht?week=${appointmentDate}`);
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
          href="/wochenuebersicht"
          style={{
            color: "#111",
            textDecoration: "none",
          }}
        >
          ← Zurück zur Wochenübersicht
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
          <h1 style={{ marginTop: 0 }}>Termin</h1>

          <p>
            <strong>Kundin:</strong>{" "}
            {customer?.first_name} {customer?.last_name ?? ""}
          </p>

          <p>
            <strong>Service:</strong> {service?.name ?? "Service"}
          </p>

          <p>
            <strong>Datum:</strong> {date}
          </p>

          <p>
            <strong>Uhrzeit:</strong> {time}
          </p>

          {service && (
            <>
              <p>
                <strong>Dauer:</strong> {service.duration} Minuten
              </p>

              <p>
                <strong>Preis:</strong>{" "}
                {service.price.toLocaleString()} THB
              </p>
            </>
          )}
          <Link
  href={`/termine/${id}/bearbeiten`}
  style={{
    display: "inline-block",
    marginTop: 20,
    padding: "12px 18px",
    background: "#000",
    color: "#fff",
    borderRadius: 10,
    textDecoration: "none",
    fontWeight: 600,
  }}
>
  Termin bearbeiten
</Link>
          <DeleteAppointmentButton action={deleteAppointment} />
        </div>
      </div>
    </main>
  );
}
