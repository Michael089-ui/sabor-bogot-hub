import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registroSchema, RegistroFormData } from "@/lib/validations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import { useTheme } from "next-themes";
import loginBgDark from "@/assets/login-bg-dark.png";
import loginBgLight from "@/assets/login-bg-light.png";
import { useLocalidades, useBarriosPorLocalidad } from "@/hooks/useBarriosBogota";
import { LocationCombobox } from "@/components/LocationCombobox";

const Registro = () => {
  const { signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [selectedLocalidadId, setSelectedLocalidadId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<RegistroFormData>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      tipo_comida: [],
      presupuesto: "",
      id_localidad: "",
      id_barrio: "",
    },
  });

  const presupuestoValue = watch("presupuesto");
  const watchLocalidadId = watch("id_localidad");
  const watchBarrioId = watch("id_barrio");

  // Cargar localidades y barrios
  const { data: localidades = [], isLoading: loadingLocalidades } = useLocalidades();
  const { data: barrios = [], isLoading: loadingBarrios } = useBarriosPorLocalidad(selectedLocalidadId);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Sincronizar selectedLocalidadId con el valor del formulario
  useEffect(() => {
    if (watchLocalidadId && watchLocalidadId !== selectedLocalidadId) {
      setSelectedLocalidadId(watchLocalidadId);
    }
  }, [watchLocalidadId, selectedLocalidadId]);

  const preferences = [
    "Italiana",
    "Mexicana",
    "Japonesa",
    "Vegetariana",
    "China",
    "Francesa",
    "Mediterránea",
    "Fusión",
    "Colombiana",
    "Corrientazos"
  ];

  const togglePreference = (preference: string) => {
    const updated = selectedPreferences.includes(preference)
      ? selectedPreferences.filter((p) => p !== preference)
      : [...selectedPreferences, preference];
    setSelectedPreferences(updated);
    setValue("tipo_comida", updated);
    trigger("tipo_comida");
  };

  // Función para permitir solo números en el teléfono
  const handlePhoneInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir: backspace, delete, tab, escape, enter, puntos, guiones, paréntesis y números
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', '.', '-', '(', ')', '+'];
    
    if (allowedKeys.includes(e.key) || 
        // Permitir: números
        (e.key >= '0' && e.key <= '9') ||
        // Permitir: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key))) {
      return;
    }
    
    // Prevenir cualquier otra tecla
    e.preventDefault();
  };

  // Función para formatear el teléfono mientras se escribe
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remover todo excepto números
    const formattedValue = formatPhoneNumber(value);
    e.target.value = formattedValue;
  };

  // Función para formatear el número de teléfono
  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    
    const phoneNumber = value.replace(/\D/g, '');
    const phoneNumberLength = phoneNumber.length;
    
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3)}`;
    }
    return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6, 10)}`;
  };

  const onSubmit = async (data: RegistroFormData) => {
    setIsLoading(true);
    await signUp({
      email: data.email,
      password: data.password,
      nombre: data.nombre,
      apellidos: data.apellidos,
      telefono: data.telefono,
      tipo_comida: data.tipo_comida,
      presupuesto: data.presupuesto,
      id_localidad: data.id_localidad,
      id_barrio: data.id_barrio,
    });
    setIsLoading(false);
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    await signInWithGoogle();
    setIsLoading(false);
  };

  const backgroundImage = theme === "dark" ? loginBgDark : loginBgLight;

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      {/* Header */}
      <header className="border-b border-border/40 bg-background/60 backdrop-blur-md relative z-10">
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
      <main className="container mx-auto px-4 py-12 max-w-6xl relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            Descubre, saborea y recomienda con IA
          </h1>
        </div>

        {/* Registro Card */}
        <Card className="max-w-2xl mx-auto shadow-lg border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold">Crea tu cuenta</CardTitle>
            <CardDescription>
              Completa tus datos para comenzar tu experiencia gastronómica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Nombre y Apellidos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="flex items-center gap-1">
                    Nombre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    type="text"
                    placeholder="Juan"
                    {...register("nombre")}
                    required
                  />
                  {errors.nombre && (
                    <p className="text-sm text-destructive">{errors.nombre.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellidos" className="flex items-center gap-1">
                    Apellidos <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="apellidos"
                    type="text"
                    placeholder="Pérez García"
                    {...register("apellidos")}
                    required
                  />
                  {errors.apellidos && (
                    <p className="text-sm text-destructive">{errors.apellidos.message}</p>
                  )}
                </div>
              </div>

              {/* Correo electrónico */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  Correo electrónico <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  {...register("email")}
                  required
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="telefono" className="flex items-center gap-1">
                  Teléfono <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="+57 123 456 7890"
                  {...register("telefono")}
                  onKeyDown={handlePhoneInput}
                  onChange={handlePhoneChange}
                  required
                />
                {errors.telefono && (
                  <p className="text-sm text-destructive">{errors.telefono.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Formato: +57 123 456 7890
                </p>
              </div>

              {/* Localidad y Barrio */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_localidad" className="flex items-center gap-1">
                    Localidad <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watchLocalidadId || ""}
                    onValueChange={(value) => {
                      setValue("id_localidad", value);
                      setSelectedLocalidadId(value);
                      setValue("id_barrio", "");
                      trigger("id_localidad");
                    }}
                    disabled={loadingLocalidades}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        loadingLocalidades 
                          ? "Cargando localidades..." 
                          : "Selecciona una localidad"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {localidades.map((loc) => (
                        <SelectItem key={loc.id_localidad} value={loc.id_localidad}>
                          {loc.numero}. {loc.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.id_localidad && (
                    <p className="text-sm text-destructive">{errors.id_localidad.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_barrio" className="flex items-center gap-1">
                    Barrio <span className="text-destructive">*</span>
                  </Label>
                  <LocationCombobox
                    options={barrios.map(barrio => ({
                      value: barrio.id_barrio,
                      label: barrio.nombre
                    }))}
                    value={watchBarrioId || ""}
                    onValueChange={(value) => {
                      setValue("id_barrio", value);
                      trigger("id_barrio");
                    }}
                    placeholder={
                      !selectedLocalidadId 
                        ? "Primero selecciona localidad" 
                        : loadingBarrios
                          ? "Cargando barrios..."
                          : barrios.length === 0
                            ? "No hay barrios para esta localidad"
                            : "Selecciona un barrio"
                    }
                    searchPlaceholder="Buscar barrio..."
                    emptyText="No se encontró el barrio"
                    disabled={!selectedLocalidadId || loadingBarrios}
                  />
                  {errors.id_barrio && (
                    <p className="text-sm text-destructive">{errors.id_barrio.message}</p>
                  )}
                </div>
              </div>

              {/* Contraseñas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-1">
                    Contraseña <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...register("password")}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-1">
                    Confirmar <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...register("confirmPassword")}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Presupuesto */}
              <div className="space-y-2">
                <Label htmlFor="presupuesto" className="flex items-center gap-1">
                  Presupuesto promedio <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={presupuestoValue} 
                  onValueChange={(value) => {
                    setValue("presupuesto", value);
                    trigger("presupuesto");
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu presupuesto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economico">Económico (10.000 COP - 20.000 COP)</SelectItem>
                    <SelectItem value="medio">Medio (21.000 COP - 50.000 COP)</SelectItem>
                    <SelectItem value="alto">Alto (51.000 COP - 80.000 COP)</SelectItem>
                    <SelectItem value="premium">Premium (81.000 COP +)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.presupuesto && (
                  <p className="text-sm text-destructive">{errors.presupuesto.message}</p>
                )}
              </div>

              {/* Preferencias gastronómicas */}
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-base flex items-center gap-1">
                    Preferencias Gastronómicas <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Selecciona al menos una preferencia
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
                {errors.tipo_comida && (
                  <p className="text-sm text-destructive">{errors.tipo_comida.message}</p>
                )}
                <div className="text-xs text-muted-foreground">
                  {selectedPreferences.length} preferencias seleccionadas
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
                  {isLoading ? "Creando cuenta..." : "Crear cuenta"}
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
                  onClick={handleGoogleSignup}
                  disabled={isLoading}
                  type="button"
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
              <div className="text-center text-sm pt-2">
                <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Inicia sesión aquí
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Registro;