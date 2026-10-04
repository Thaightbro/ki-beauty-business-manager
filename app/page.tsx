import { createClient } from "@supabase/supabase-js";

export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data: services } = await supabase
    .from("Services")
    .select("*")
    .eq("active", true);

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#252525]">
      {/* Header */}
      <header className="border-b border-black/10 bg-white px-8 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              KI Beauty
            </h1>
            <p className="text-sm text-gray-500">Business Manager</p>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium">Dashboard</p>
            <p className="text-xs text-gray-500">Bangkok, Thailand</p>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-8 py-8">
        {/* Navigation */}
        <aside className="w-56 shrink-0">
          <nav className="space-y-2">
            <div className="rounded-xl bg-black px-4 py-3 text-sm text-white">
              Dashboard
            </div>

            <div className="rounded-xl px-4 py-3 text-sm hover:bg-white">
              Termine
            </div>

            <div className="rounded-xl px-4 py-3 text-sm hover:bg-white">
              Wochenübersicht
            </div>

            <div className="rounded-xl px-4 py-3 text-sm hover:bg-white">
              Kunden
            </div>

            <div className="rounded-xl px-4 py-3 text-sm hover:bg-white">
              Services
            </div>
          </nav>
        </aside>

        {/* Dashboard */}
        <section className="flex-1">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold">Dashboard</h2>
            <p className="mt-1 text-gray-500">
              Übersicht über dein KI Beauty Studio
            </p>
          </div>

          {/* Statistik-Karten */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Termine heute</p>
              <p className="mt-3 text-3xl font-semibold">0</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Kunden</p>
              <p className="mt-3 text-3xl font-semibold">0</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Aktive Services</p>
              <p className="mt-3 text-3xl font-semibold">
                {services?.length ?? 0}
              </p>
            </div>
          </div>

          {/* Services */}
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Services</h3>
                <p className="text-sm text-gray-500">
                  Aktuell angebotene Behandlungen
                </p>
              </div>
            </div>

            <div className="divide-y divide-black/5">
              {services?.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="font-medium">{service.name}</p>

                    {service.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {service.description}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      {service.price?.toLocaleString()} THB
                    </p>
                    <p className="text-sm text-gray-500">
                      {service.duration} Min.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
