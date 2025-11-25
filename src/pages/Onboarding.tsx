import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { LogoSaborCapital } from "@/components/LogoSaborCapital";
import { useLocalidades, useBarriosPorLocalidad } from "@/hooks/useBarriosBogota";
import { LocationCombobox } from "@/components/LocationCombobox";

const onboardingSchema = z.object({
  telefono: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  tipo_comida: z.array(z.string()).min(1, "Selecciona al menos una preferencia"),
  presupuesto: z.string().min(1, "Selecciona un presupuesto"),
  id_localidad: z.string().min(1, "Selecciona una localidad"),
  id_barrio: z.string().min(1, "Selecciona un barrio"),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [selectedLocalidad, setSelectedLocalidad] = useState<string | null>(null);
  
  const isGoogleUser = user?.app_metadata?.provider === 'google';
  
  const { data: localidades = [], isLoading: loadingLocalidades } = useLocalidades();
  const { data: barrios = [], isLoading: loadingBarrios } = useBarriosPorLocalidad(selectedLocalidad);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      tipo_comida: [],
    },
  });
  
  const watchLocalidad = watch("id_localidad");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);
  
  useEffect(() => {
    if (watchLocalidad) {
      setSelectedLocalidad(watchLocalidad);
      setValue("id_barrio", ""); // Reset barrio when localidad changes
    }
  }, [watchLocalidad, setValue]);

  const preferences = [
    "Mexicana",
    "Italiana",
    "Japonesa",
    "China",
    "Tailandesa",
    "India",
    "Americana",
    "Española",
    "Francesa",
    "Mediterránea",
    "Fusión",
    "Colombiana",
    "Corrientazos"
  ];

  const togglePreference = (preference: string) => {
    const newPreferences = selectedPreferences.includes(preference)
      ? selectedPreferences.filter((p) => p !== preference)
      : [...selectedPreferences, preference];
    
    setSelectedPreferences(newPreferences);
    setValue("tipo_comida", newPreferences);
  };

  const onSubmit = async (data: OnboardingFormData) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("usuario")
        .upsert(
          {
            id: user.id,
            email: user.email,
            telefono: data.telefono,
            tipo_comida: data.tipo_comida,
            presupuesto: data.presupuesto,
            id_localidad: data.id_localidad,
            id_barrio: data.id_barrio,
            onboarding_completed: true,
          },
          { onConflict: "id" }
        );

      if (error) {
        toast.error("Error al completar tu perfil");
        console.error("Error updating profile:", error);
        return;
      }

      toast.success("¡Perfil completado! Bienvenido a Sabor Capital");
      
      // Forzar recarga para refrescar el estado del usuario
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast.error("Error al completar tu perfil");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <LogoSaborCapital className="h-8" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-3xl">Completa tu Perfil</CardTitle>
              <CardDescription>
                Solo un paso más para personalizar tu experiencia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="3001234567"
                    {...register("telefono")}
                  />
                  {errors.telefono && (
                    <p className="text-sm text-destructive">{errors.telefono.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_localidad">Localidad</Label>
                  <LocationCombobox
                    options={localidades.map(loc => ({
                      value: loc.id_localidad,
                      label: `${loc.numero}. ${loc.nombre}`
                    }))}
                    value={watchLocalidad || ""}
                    onValueChange={(value) => {
                      setValue("id_localidad", value);
                      setSelectedLocalidad(value);
                      setValue("id_barrio", ""); // Reset barrio when localidad changes
                    }}
                    placeholder={loadingLocalidades ? "Cargando..." : "Selecciona tu localidad"}
                    disabled={loadingLocalidades}
                  />
                  {errors.id_localidad && (
                    <p className="text-sm text-destructive">{errors.id_localidad.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_barrio">Barrio</Label>
                  <LocationCombobox
                    options={barrios.map(barrio => ({
                      value: barrio.id_barrio,
                      label: barrio.nombre
                    }))}
                    value={watch("id_barrio") || ""}
                    onValueChange={(value) => setValue("id_barrio", value)}
                    placeholder={
                      !selectedLocalidad 
                        ? "Primero selecciona una localidad" 
                        : loadingBarrios 
                          ? "Cargando..." 
                          : "Selecciona tu barrio"
                    }
                    disabled={!selectedLocalidad || loadingBarrios}
                  />
                  {errors.id_barrio && (
                    <p className="text-sm text-destructive">{errors.id_barrio.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="presupuesto">Presupuesto Promedio</Label>
                  <Select onValueChange={(value) => setValue("presupuesto", value)}>
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

                <div className="space-y-3">
                  <Label>Preferencias de Cocina</Label>
                  <div className="flex flex-wrap gap-2">
                    {preferences.map((preference) => (
                      <Badge
                        key={preference}
                        variant={selectedPreferences.includes(preference) ? "default" : "outline"}
                        className="cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => togglePreference(preference)}
                      >
                        {preference}
                      </Badge>
                    ))}
                  </div>
                  {errors.tipo_comida && (
                    <p className="text-sm text-destructive">{errors.tipo_comida.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Completar Perfil"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
