import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

export default async function WochenuebersichtPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
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
const selectedWeek = week ?? null;

const today = selectedWeek
  ? new Date(`${selectedWeek}T00:00:00`)
  : new Date();

const dayOfWeek = today.getDay();
const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

const weekStart = new Date(today);
weekStart.setDate(today.getDate() - daysSinceMonday);
weekStart.setHours(0, 0, 0, 0);

const weekDays = Array.from({ length: 7 }, (_, index) => {
  const day = new Date(weekStart);
  day.setDate(weekStart.getDate() + index);
  return day;
});

const previousWeek = new Date(weekStart);
previousWeek.setDate(weekStart.getDate() - 7);

const nextWeek = new Date(weekStart);
nextWeek.setDate(weekStart.getDate() + 7);

const formatWeekParam = (date: Date) =>
  date.toLocaleDateString("en-CA", {
    timeZone: "Asia/Bangkok",
  });

  const openingHours = {
  1: { open: 8, close: 20 }, // Montag
  2: { open: 8, close: 20 }, // Dienstag
  3: { open: 8, close: 20 }, // Mittwoch
  4: { open: 8, close: 20 }, // Donnerstag
  5: { open: 8, close: 20 }, // Freitag
  6: { open: 8, close: 20 }, // Samstag
  0: { open: 8, close: 20 }, // Sonntag
} as const;
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
          <div>Wochenübersicht</div>
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

          <Link href="/termine" style={navStyle}>
            Termine
          </Link>

          <Link href="/wochenuebersicht" style={activeNavStyle}>
            Wochenübersicht
          </Link>

          <Link href="/kunden" style={navStyle}>
            Kunden
          </Link>

          <div style={navStyle}>Services</div>
        </nav>

        <section>
          <div style={{ marginBottom: 30 }}>
            <h1 style={{ fontSize: 36, margin: 0 }}>Wochenübersicht</h1>
            <p style={{ color: "#6b7280" }}>
              Deine Termine auf einen Blick
            </p>
            <div
  style={{
    display: "flex",
    gap: 12,
    marginTop: 18,
  }}
>
  <Link
    href={`/wochenuebersicht?week=${formatWeekParam(previousWeek)}`}
    style={weekButtonStyle}
  >
    ← Vorherige Woche
  </Link>

  <Link
    href={`/wochenuebersicht?week=${formatWeekParam(nextWeek)}`}
    style={weekButtonStyle}
  >
    Nächste Woche →
  </Link>
</div>
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
                Noch keine Termine vorhanden.
              </div>
            )}

<div
  style={{
    display: "grid",
   gridTemplateColumns: "70px repeat(7, minmax(140px, 1fr))",
    gap: 1,
    background: "#e5e5e5",
    border: "1px solid #e5e5e5",
    borderRadius: 12,
    overflow: "hidden",
  }}
>
  <div
  style={{
    background: "#fff",
    minHeight: 420,
    borderRight: "1px solid #e5e5e5",
  }}
>
  <div
    style={{
      height: 70,
      borderBottom: "1px solid #e5e5e5",
    }}
  />

  <div>
    {Array.from({ length: 12 }, (_, index) => {
      const hour = 8 + index;

      return (
        <div
          key={hour}
          style={{
            height: 60,
            paddingRight: 10,
            textAlign: "right",
            fontSize: 12,
            color: "#6b7280",
          }}
        >
          {String(hour).padStart(2, "0")}:00
        </div>
      );
    })}
  </div>
</div>
  {weekDays.map((day) => {
    const dayLabel = day.toLocaleDateString("de-CH", {
      timeZone: "Asia/Bangkok",
      weekday: "short",
    });

    const dayDate = day.toLocaleDateString("de-CH", {
      timeZone: "Asia/Bangkok",
      day: "2-digit",
      month: "2-digit",
    });

    const dayKey = day.toLocaleDateString("en-CA", {
      timeZone: "Asia/Bangkok",
    });

    const dayAppointments = appointments?.filter((appointment) => {
      const appointmentDate = new Date(
        appointment.start_time
      ).toLocaleDateString("en-CA", {
        timeZone: "Asia/Bangkok",
      });

      return appointmentDate === dayKey;
    });

    return (
      <div
        key={dayKey}
        style={{
          background: "#fff",
          minHeight: 420,
        }}
      >
        <div
          style={{
            padding: 16,
            textAlign: "center",
            borderBottom: "1px solid #e5e5e5",
          }}
        >
          <div style={{ fontWeight: 700 }}>{dayLabel}</div>
          <div
            style={{
              color: "#6b7280",
              fontSize: 14,
              marginTop: 4,
            }}
          >
            {dayDate}
          </div>
        </div>

        <div
  style={{
    position: "relative",
    height: 720,
    backgroundImage:
      "repeating-linear-gradient(to bottom, transparent 0, transparent 59px, #e5e5e5 60px)",
  }}
>
  {(() => {
  const dayOpeningHours =
    openingHours[day.getDay() as keyof typeof openingHours];

  return Array.from({ length: 24 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const slotMinutes = hour * 60 + minute;
const openMinutes = dayOpeningHours.open * 60;
const closeMinutes = dayOpeningHours.close * 60;

if (slotMinutes < openMinutes || slotMinutes >= closeMinutes) {
  return null;
}

  const time = `${String(hour).padStart(2, "0")}:${String(
    minute
  ).padStart(2, "0")}`;

  return (
    <Link
      key={time}
      href={`/termine/neu?date=${dayKey}&time=${time}`}
      style={{
        position: "absolute",
        top: index * 30,
        left: 0,
        right: 0,
        height: 30,
        zIndex: 1,
      }}
      aria-label={`Neuer Termin am ${dayKey} um ${time}`}
    />
   );
  });
})()}
          {dayAppointments?.map((appointment) => {
            const start = new Date(appointment.start_time);
  const timeParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Bangkok",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
}).formatToParts(start);

const startHour = Number(
  timeParts.find((part) => part.type === "hour")?.value ?? 0
);

const startMinute = Number(
  timeParts.find((part) => part.type === "minute")?.value ?? 0
);

const topPosition = (startHour - 8) * 60 + startMinute;

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
             <Link
  href={`/termine/${appointment.id}`}
  key={appointment.id}
  style={{
  position: "absolute",
  zIndex: 2,
  top: topPosition,
  left: 6,
  right: 6,
  height: service?.duration ?? 60,
  background: "#f7f5f2",
  borderRadius: 10,
  padding: 8,
  boxSizing: "border-box",
  overflow: "hidden",
}}
              >
                <div style={{ fontWeight: 700 }}>{time}</div>

                <div
                  style={{
                    fontWeight: 600,
                    marginTop: 6,
                  }}
                >
                  {customer?.first_name} {customer?.last_name ?? ""}
                </div>

                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 13,
                    marginTop: 4,
                  }}
                >
                  {service?.name ?? "Service"}
                </div>

                {service && (
                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    {service.duration} Min. ·{" "}
                    {service.price.toLocaleString()} THB
                  </div>
                )}
             </Link>
            );
          })}
        </div>
      </div>
    );
  })}
</div>
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
const weekButtonStyle = {
  display: "inline-block",
  padding: "10px 16px",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  textDecoration: "none",
  color: "#111",
  background: "#fff",
  fontWeight: 600,
};
