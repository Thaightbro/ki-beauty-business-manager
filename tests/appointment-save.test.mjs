import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { getAppointmentTimes } from "../lib/appointment-time.ts";

// Execute the actual page save functions in isolation, with no network/client setup.
function loadSaveFunction(path, name, dependencies) {
  const source = ts.createSourceFile(path, readFileSync(new URL(path, import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let declaration;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) declaration = node;
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(declaration, `Missing save function ${name}`);
  const { outputText } = ts.transpileModule(declaration.getText(source).replace(/^export /, ""), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  return new Function(...Object.keys(dependencies), `${outputText}\nreturn ${name};`)(...Object.values(dependencies));
}

function mockSupabase(rows, { duration = 60, conflictError = false, serviceError = false, services = [{ id: 3, duration, active: true }] } = {}) {
  const writes = [];
  const client = {
    from(table) {
      const filters = [];
      let payload;
      let operation;
      const query = {
        select() { return query; },
        eq(field, value) { filters.push(row => String(row[field]) === String(value)); return query; },
        neq(field, value) { filters.push(row => String(row[field]) !== String(value)); return query; },
        lt(field, value) { filters.push(row => row[field] < value); return query; },
        gt(field, value) { filters.push(row => row[field] > value); return query; },
        limit() { return query; },
        single() { return query; },
        insert(value) { operation = "insert"; payload = value; return query; },
        update(value) { operation = "update"; payload = value; return query; },
        then(resolve, reject) {
          let result;
          if (table === "Services") {
            result = { data: serviceError ? null : services.find(row => filters.every(filter => filter(row))) ?? null, error: serviceError ? {} : null };
          } else if (operation) {
            writes.push({ operation, payload, ids: rows.filter(row => filters.every(filter => filter(row))).map(row => row.id) });
            result = { data: { id: 1, ...payload }, error: null };
          } else {
            result = { data: rows.filter(row => filters.every(filter => filter(row))), error: conflictError ? {} : null };
          }
          return Promise.resolve(result).then(resolve, reject);
        },
      };
      return query;
    },
  };
  return { client, writes };
}

function appointment(id, start, end, status = "booked") {
  return { id, start_time: `2026-10-04T${start}:00.000Z`, end_time: `2026-10-04T${end}:00.000Z`, status };
}

async function save(mode, rows = [], options = {}) {
  const { client, writes } = mockSupabase(rows, options);
  const date = "2026-10-04";
  const time = options.time ?? "10:00"; // 03:00 UTC
  const duration = options.clientDuration ?? options.duration ?? 60;
  let error = "";
  let redirected = false;
  const dependencies = { getAppointmentTimes };
  if (mode === "create") {
    Object.assign(dependencies, {
      createAppointment: loadSaveFunction("../app/termine/neu/actions.ts", "createAppointment", {
        getAppointmentTimes, createClient: () => client,
      }),
      formComplete: true, selectedService: { duration },
      customerId: "2", serviceId: options.serviceId ?? "3", date, time,
      setSaving() {}, setError(value) { error = value; },
      router: { push() { redirected = true; }, refresh() {} },
    });
    const fn = loadSaveFunction("../app/termine/neu/page.tsx", "saveAppointment", dependencies);
    await fn();
  } else {
    Object.assign(dependencies, { createClient: () => client, id: "1", redirect() { redirected = true; } });
    const fn = loadSaveFunction("../app/termine/[id]/bearbeiten/page.tsx", "updateAppointment", dependencies);
    const form = new FormData();
    for (const [key, value] of Object.entries({ customer_id: "2", service_id: options.serviceId ?? "3", date, time, duration: String(duration), end_time: "2026-10-04T13:00:00.000Z" })) form.set(key, value);
    error = await fn("", form);
  }
  return { writes, error, redirected };
}

for (const mode of ["create", "edit"]) {
  test(`${mode}: writes calculated start AND end using selected service duration`, async () => {
    const result = await save(mode, [appointment(1, "01:00", "02:00")], { duration: 90 });
    assert.equal(result.writes.length, 1);
    assert.equal(result.writes[0].operation, mode === "create" ? "insert" : "update");
    assert.equal(result.writes[0].payload.start_time, "2026-10-04T03:00:00.000Z");
    assert.equal(result.writes[0].payload.end_time, "2026-10-04T04:30:00.000Z");
    if (mode === "edit") assert.deepEqual(result.writes[0].ids, [1]);
    assert.equal(result.redirected, true);
  });
  for (const [start, end] of [["03:30", "04:30"], ["02:30", "03:30"], ["02:00", "05:00"], ["03:15", "03:45"], ["03:00", "04:00"]]) {
    test(`${mode}: rejects overlap ${start}–${end}`, async () => {
      const result = await save(mode, [appointment(2, start, end)]);
      assert.match(result.error, /bereits belegt/);
      assert.equal(result.writes.length, 0);
      assert.equal(result.redirected, false);
    });
  }
  test(`${mode}: allows adjacent appointments and ignores cancelled bookings`, async () => {
    const result = await save(mode, [appointment(2, "02:00", "03:00"), appointment(3, "04:00", "05:00"), appointment(4, "03:00", "04:00", "cancelled")]);
    assert.equal(result.writes.length, 1);
  });
  test(`${mode}: blocks saving when conflict check fails`, async () => {
    const result = await save(mode, [], { conflictError: true });
    assert.match(result.error, /nicht geprüft/);
    assert.equal(result.writes.length, 0);
  });
  for (const time of ["07:59", "19:30"]) {
    test(`${mode}: opening-hours validation blocks writes at ${time}`, async () => {
      const result = await save(mode, [], { time });
      assert.match(result.error, /Öffnungszeiten/);
      assert.equal(result.writes.length, 0);
    });
  }
}

test("edit: own appointment is excluded from conflicts", async () => {
  const result = await save("edit", [appointment(1, "03:00", "04:00")]);
  assert.equal(result.writes.length, 1);
});

test("edit: excluding own appointment does not hide another conflict", async () => {
  const result = await save("edit", [appointment(1, "03:00", "04:00"), appointment(2, "03:30", "04:30")]);
  assert.match(result.error, /bereits belegt/);
  assert.equal(result.writes.length, 0);
});

test("edit: service lookup failure prevents writing", async () => {
  const result = await save("edit", [], { serviceError: true });
  assert.match(result.error, /Behandlungsdauer/);
  assert.equal(result.writes.length, 0);
});

for (const mode of ["create", "edit"]) {
  for (const [time, duration, allowed] of [["19:00", 120, false], ["19:00", 60, true], ["19:30", 30, true], ["19:30", 60, false]]) {
    test(`${mode}: ${time} + ${duration} minutes ${allowed ? "allowed" : "rejected"}`, async () => {
      const result = await save(mode, [], { time, duration });
      assert.equal(result.writes.length, allowed ? 1 : 0);
      if (allowed) assert.equal(result.writes[0].payload.end_time, "2026-10-04T13:00:00.000Z");
      else assert.match(result.error, /Öffnungszeiten/);
    });
  }
  test(`${mode}: stale/tampered client duration cannot allow 19:00 with a 120-minute service`, async () => {
    const result = await save(mode, [], { time: "19:00", duration: 120, clientDuration: 60 });
    assert.equal(result.writes.length, 0);
    assert.match(result.error, /Öffnungszeiten/);
  });
}

for (const mode of ["create", "edit"]) {
  test(`${mode}: looks up the selected service ID, not the first or previous service`, async () => {
    const services = [{ id: 3, duration: 30, active: true }, { id: 4, duration: 120, active: true }];
    const result = await save(mode, [], { serviceId: "4", services, time: "19:00", clientDuration: 30 });
    assert.equal(result.writes.length, 0);
    assert.match(result.error, /Öffnungszeiten/);
    const allowed = await save(mode, [], { serviceId: "3", services, time: "19:30", clientDuration: 120 });
    assert.equal(allowed.writes.length, 1);
    assert.equal(allowed.writes[0].payload.service_id.toString(), "3");
    assert.equal(allowed.writes[0].payload.end_time, "2026-10-04T13:00:00.000Z");
  });
  for (const options of [{ serviceError: true }, { services: [] }, { duration: null }, { duration: 0 }]) {
    test(`${mode}: unavailable/invalid service duration blocks saving ${JSON.stringify(options)}`, async () => {
      const result = await save(mode, [], options);
      assert.equal(result.writes.length, 0);
      assert.match(result.error, /Behandlungsdauer/);
    });
  }
}

test("create: server action ignores forged browser duration and end time", async () => {
  const { client, writes } = mockSupabase([], { duration: 120 });
  const createAppointment = loadSaveFunction("../app/termine/neu/actions.ts", "createAppointment", {
    getAppointmentTimes, createClient: () => client,
  });
  const form = new FormData();
  for (const [key, value] of Object.entries({ customer_id: "2", service_id: "3", date: "2026-10-04", time: "19:00", duration: "60", end_time: "2026-10-04T13:00:00.000Z" })) form.set(key, value);
  const error = await createAppointment(form);
  assert.match(error, /Öffnungszeiten/);
  assert.equal(writes.length, 0);
});
