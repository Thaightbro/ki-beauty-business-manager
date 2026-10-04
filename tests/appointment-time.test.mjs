import assert from "node:assert/strict";
import test from "node:test";
import { getAppointmentTimes } from "../lib/appointment-time.ts";

test("08:00 Bangkok is stored as 01:00 UTC with the service duration", () => {
  const result = getAppointmentTimes("2026-10-04", "08:00", 90);
  assert.equal(result.error, undefined);
  assert.equal(result.startTime.toISOString(), "2026-10-04T01:00:00.000Z");
  assert.equal(result.endTime.toISOString(), "2026-10-04T02:30:00.000Z");
});

test("ending exactly at closing time is allowed", () => {
  const result = getAppointmentTimes("2026-10-04", "19:30", 30);
  assert.equal(result.error, undefined);
  assert.equal(result.endTime.toISOString(), "2026-10-04T13:00:00.000Z");
});

test("changing the service duration recalculates the end", () => {
  const short = getAppointmentTimes("2026-10-04", "10:00", 30);
  const long = getAppointmentTimes("2026-10-04", "10:00", 90);
  assert.equal(long.endTime.getTime() - short.endTime.getTime(), 60 * 60 * 1000);
});

for (const [time, duration] of [["07:59", 30], ["19:30", 31], ["20:00", 1], ["23:30", 60]]) {
  test(`rejects appointment outside opening hours: ${time}, ${duration} minutes`, () => {
    assert.match(getAppointmentTimes("2026-10-04", time, duration).error, /Öffnungszeiten/);
  });
}

for (const duration of [0, -1, NaN, Infinity, undefined, null, "30"]) {
  test(`rejects invalid duration ${String(duration)}`, () => {
    assert.match(getAppointmentTimes("2026-10-04", "10:00", duration).error, /Behandlungsdauer/);
  });
}

for (const [date, time] of [["", "10:00"], ["2026-02-30", "10:00"], ["2026-10-04", "24:00"], ["2026-10-04", "12:60"], ["2026-10-04", ""]]) {
  test(`rejects invalid date/time ${date} ${time}`, () => {
    assert.match(getAppointmentTimes(date, time, 30).error, /ungültig/);
  });
}

for (const [time, duration, allowed] of [["19:00", 120, false], ["19:00", 60, true], ["19:30", 30, true], ["19:30", 60, false]]) {
  test(`closing-time regression: ${time} + ${duration} minutes`, () => {
    const result = getAppointmentTimes("2026-10-04", time, duration);
    if (allowed) {
      assert.equal(result.error, undefined);
      assert.equal(result.endTime.toISOString(), "2026-10-04T13:00:00.000Z");
    } else assert.match(result.error, /Öffnungszeiten/);
  });
}
