import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

export default async function TerminePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

const { data: appointments, error } = await supabase
  .from("Appointments")
  .select("*")
  .order("start_time", { ascending: true });
  const { data: customers } = await supabase
  .from("Customers")
  .select("*");

const { data: services } = await supabase
  .from("Services")
  .select("*");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f5f2",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          background: "white",
          padding: "22px 4%",
          borderBottom: "1px solid #e5e5e5",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>KI Beauty</div>
          <div style={{ color: "#6b7280" }}>Business Manager</div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div>Termine</div>
          <div style={{ color: "#6b7280" }}>Bangkok, Thailand</div>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "250px 1fr",
          gap: 36,
          maxWidth: 1450,
          margin: "0 auto",
          padding: "36px 4%",
        }}
      >
        <nav>
          <Link href="/" style={navStyle}>
            Dashboard
          </Link>

          <Link href="/termine" style={activeNavStyle}>
            Termine
          </Link>

          <div style={navStyle}>Wochenübersicht</div>

          <Link href="/kunden" style={navStyle}>
            Kunden
          </Link>

          <div style={navStyle}>Services</div>
        </nav>

        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 30,
            }}
          >
            <div>
              <h1 style={{ fontSize: 36, margin: 0 }}>Termine</h1>

              <p style={{ color: "#6b7280" }}>
                Alle Termine deines KI Beauty Studios
              </p>
            </div>

            <Link
              href="/termine/neu"
              style={{
                background: "#000",
                color: "#fff",
                borderRadius: 10,
                padding: "14px 20px",
                fontSize: 16,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              + Neuer Termin
            </Link>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: 18,
              padding: 28,
            }}
          >
            {error && (
              <p style={{ color: "red" }}>
                Fehler beim Laden der Termine: {error.message}
              </p>
            )}

            {!error && (!appointments || appointments.length === 0) && (
              <div
                style={{
                  textAlign: "center",
                  padding: "70px 20px",
                  color: "#6b7280",
                }}
              >
                <h2 style={{ color: "#111", marginBottom: 10 }}>
                  Noch keine Termine
                </h2>

                <p>
                  Sobald ein Termin erstellt wurde, erscheint er hier.
                </p>
              </div>
            )}

            {appointments?.map((appointment) => {
              const start = new Date(appointment.start_time);

              const date = start.toLocaleDateString("de-CH", {
                timeZone: "Asia/Bangkok",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });

              const time = start.toLocaleTimeString("de-CH", {
                timeZone: "Asia/Bangkok",
                hour: "2-digit",
                minute: "2-digit",
              });

const customer = customers?.find(
  (customer) => customer.id === appointment.customer_id
);

const service = services?.find(
  (service) => service.id === appointment.service_id
);
              return (
                <div
                  key={appointment.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr 1fr 160px",
                    gap: 20,
                    alignItems: "center",
                    padding: "22px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{date}</div>
                    <div style={{ color: "#6b7280", marginTop: 4 }}>
                      {time} Uhr
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {customer?.first_name} {customer?.last_name ?? ""}
                    </div>

                    {customer?.phone && (
                      <div
                        style={{
                          color: "#6b7280",
                          marginTop: 4,
                        }}
                      >
                        {customer.phone}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {service?.name ?? "Service"}
                    </div>

                    {service && (
                      <div
                        style={{
                          color: "#6b7280",
                          marginTop: 4,
                        }}
                      >
                        {service.duration} Min. ·{" "}
                        {service.price.toLocaleString()} THB
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {appointment.status === "booked"
                      ? "Gebucht"
                      : appointment.status}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

const navStyle = {
  display: "block",
  padding: "14px 18px",
  marginBottom: 8,
  textDecoration: "none",
  color: "#111",
  borderRadius: 10,
};

const activeNavStyle = {
  ...navStyle,
  background: "#000",
  color: "#fff",
  fontWeight: 600,
};
