export function getAppointmentTimes(date: string, time: string, duration: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return { error: "Datum oder Uhrzeit ist ungültig." } as const;
  }

  // Studio times are always Bangkok time (UTC+7), regardless of browser/server TZ.
  const startTime = new Date(`${date}T${time}:00+07:00`);
  const [hour, minute] = time.split(":").map(Number);
  if (
    !Number.isFinite(startTime.getTime()) || hour > 23 || minute > 59 ||
    new Date(startTime.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10) !== date
  ) {
    return { error: "Datum oder Uhrzeit ist ungültig." } as const;
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    return { error: "Die Behandlungsdauer ist ungültig." } as const;
  }
  const startMinutes = hour * 60 + minute;
  if (startMinutes < 8 * 60 || startMinutes + duration > 20 * 60) {
    return { error: "Der Termin muss inklusive Behandlungsdauer innerhalb der Öffnungszeiten 08:00–20:00 (Bangkok) liegen." } as const;
  }
  return {
    startTime,
    endTime: new Date(startTime.getTime() + duration * 60 * 1000),
  } as const;
}
