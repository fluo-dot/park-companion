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
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-5 w-5" />
          ParkPilot
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">Login</Button>
          </Link>
          <Link to="/login">
            <Button size="sm">Starten</Button>
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Deine Park-App. In Minuten startklar.
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground">
              Verwalte Öffnungszeiten, Attraktionen und Wartezeiten — und biete deinen
              Besuchern eine moderne Web-App mit interaktivem Parkplan.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link to="/login">
                <Button size="lg">Jetzt loslegen</Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">Mehr erfahren</Button>
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t">
          <div className="container mx-auto px-6 py-20">
            <div className="grid gap-12 md:grid-cols-3">
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
                <div key={f.title} className="space-y-3">
                  <f.icon className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t">
          <div className="container mx-auto px-6 py-20 text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Bereit für deine eigene Park-App?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Erstelle in wenigen Minuten dein Resort, lade Karte und Attraktionen hoch — fertig.
            </p>
            <Link to="/login">
              <Button size="lg" className="mt-6">Kostenlos starten</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ParkPilot
      </footer>
    </div>
  );
}
