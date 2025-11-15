import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

const Registro = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  const preferences = [
    "Comida Típica",
    "Vegetariano",
    "Económico",
    "Postres",
    "Café de especialidad",
    "Fritanga"
  ];

  const togglePreference = (preference: string) => {
    setSelectedPreferences(prev =>
      prev.includes(preference)
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">SC</span>
            </div>
            <span className="text-xl font-bold text-foreground">Sabor Capital</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild>
              <Link to="/registro">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            Descubre, saborea y recomienda con IA
          </h1>
        </div>

        {/* Registration Card */}
        <Card className="max-w-xl mx-auto shadow-lg border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold">Crea tu cuenta</CardTitle>
            <CardDescription>
              Completa tus datos para comenzar tu experiencia gastronómica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Form Fields */}
            <div className="space-y-4">
              {/* Nombre completo */}
              <div className="space-y-2">
                <Label htmlFor="fullname">Nombre completo</Label>
                <Input
                  id="fullname"
                  type="text"
                  placeholder="Ingresa tu nombre completo"
                />
              </div>

              {/* Correo electrónico */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu.correo@ejemplo.com"
                />
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Crea una contraseña segura"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Vuelve a escribir la contraseña"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Preferencias Gastronómicas */}
            <div className="space-y-3 pt-2">
              <div>
                <Label className="text-base">Preferencias Gastronómicas Iniciales</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Ayúdanos a personalizar tus recomendaciones.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.map((preference) => (
                  <button
                    key={preference}
                    type="button"
                    onClick={() => togglePreference(preference)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedPreferences.includes(preference)
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {preference}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <Button className="w-full" size="lg">
                Crear cuenta
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    O regístrate con
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                size="lg"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Registrarse con Google
              </Button>
            </div>

            {/* Sign in link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
              <Link to="/login" className="text-primary hover:underline font-medium">
                Inicia sesión aquí
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Registro;
