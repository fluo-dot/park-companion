import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, MapPin, Clock, Smartphone } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ParkPilot — Die App-Plattform für Freizeitparks" },
      {
        name: "description",
        content:
          "ParkPilot macht es kleinen Freizeitparks einfach, eine professionelle Besucher-App mit Wartezeiten, Parkplan und Öffnungszeiten anzubieten.",
      },
      { property: "og:title", content: "ParkPilot — Die App-Plattform für Freizeitparks" },
      {
        property: "og:description",
        content:
          "Wartezeiten, interaktiver Parkplan und Öffnungszeiten — in Minuten startklar.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto flex items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
            <Sparkles className="h-5 w-5" />
          </span>
          ParkPilot
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/login">
            <Button>Kostenlos starten</Button>
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto grid gap-10 px-6 py-12 md:grid-cols-2 md:items-center md:py-20">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Für kleine & mittlere Freizeitparks
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Deine Park-App.{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                In Minuten startklar.
              </span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Verwalte Öffnungszeiten, Attraktionen und Wartezeiten — und biete deinen
              Besuchern eine moderne Web-App mit interaktivem Parkplan. Ganz ohne
              Entwickler.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/login">
                <Button size="lg" className="shadow-soft">
                  Jetzt loslegen
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">
                  Features ansehen
                </Button>
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-hero opacity-30 blur-2xl" />
            <img
              src={heroImg}
              alt="Illustrierter Freizeitpark mit Riesenrad und Achterbahn"
              className="relative rounded-3xl shadow-elevated"
            />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-muted/40 py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-center text-3xl font-bold md:text-4xl">
              Alles, was dein Park braucht
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
              Ein einfaches Management-Tool für dich. Eine schnelle Web-App für deine
              Gäste.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: MapPin,
                  title: "Interaktiver Parkplan",
                  text: "Lade deine Karte hoch und platziere Attraktionen mit einem Klick.",
                },
                {
                  icon: Clock,
                  title: "Live-Wartezeiten",
                  text: "Wartezeiten in 5-Minuten-Schritten — von 1 bis 90+.",
                },
                {
                  icon: Smartphone,
                  title: "Web-App ohne Download",
                  text: "Eine App pro Resort, mit Tabs für jeden Park und Mehr-Bereich.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-elevated"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                    <f.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-xl font-semibold">{f.title}</h3>
                  <p className="mt-2 text-muted-foreground">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl rounded-3xl bg-gradient-hero p-10 text-primary-foreground shadow-elevated">
            <h2 className="text-3xl font-bold md:text-4xl">
              Bereit für deine eigene Park-App?
            </h2>
            <p className="mt-3 text-primary-foreground/90">
              Erstelle in wenigen Minuten dein Resort, lade Karte und Attraktionen hoch
              — fertig.
            </p>
            <Link to="/login">
              <Button size="lg" variant="secondary" className="mt-6">
                Kostenlos starten
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ParkPilot — Mit Freude für Freizeitparks gebaut.
      </footer>
    </div>
  );
}
