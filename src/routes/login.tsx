import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { createDemoUser, getDemoUser } from "@/lib/demo-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — ParkPilot" },
      { name: "description", content: "Melde dich bei ParkPilot an oder erstelle ein Konto." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getDemoUser()) navigate({ to: "/dashboard" });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    createDemoUser(email, displayName || email.split("@")[0]);
    toast.success(mode === "signup" ? "Konto erstellt" : "Willkommen zurück");
    navigate({ to: "/dashboard" });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-elevated">
          <Link to="/" className="mb-6 flex items-center gap-2 font-bold">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </span>
            ParkPilot
          </Link>
          <h1 className="text-2xl font-bold">
            {mode === "signin" ? "Willkommen zurück" : "Konto erstellen"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Melde dich bei deinem Park-Dashboard an."
              : "Starte mit deiner eigenen Park-App."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Name / Betreiber</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Erlebnispark Müller"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="du@park.de"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Bitte warten…" : mode === "signin" ? "Anmelden" : "Konto erstellen"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signin"
              ? "Noch kein Konto? Jetzt registrieren"
              : "Schon ein Konto? Anmelden"}
          </button>
        </div>
      </div>
    </div>
  );
}
