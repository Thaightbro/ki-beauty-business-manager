"use server";

import { createClient } from "@supabase/supabase-js";
import { getAppointmentTimes } from "@/lib/appointment-time";

export async function createAppointment(formData: FormData): Promise<string> {
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
  // The browser's service list is only for display. Load the authoritative
  // duration for this service ID on the server immediately before saving.
  const { data: service, error: serviceError } = await supabase
    .from("Services")
    .select("duration")
    .eq("id", serviceId)
    .eq("active", true)
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
    .limit(1);
  if (conflictError) {
    return "Terminüberschneidung konnte nicht geprüft werden.";
  }
  if (conflicts && conflicts.length > 0) {
    return "Dieser Zeitraum ist bereits belegt. Bitte wähle eine andere Uhrzeit.";
  }

  const { error } = await supabase.from("Appointments").insert({
    customer_id: Number(customerId),
    service_id: Number(serviceId),
    start_time: times.startTime.toISOString(),
    end_time: times.endTime.toISOString(),
    status: "booked",
  });
  if (error) {
    return `Termin konnte nicht gespeichert werden: ${error.message}`;
  }
  return "";
}
