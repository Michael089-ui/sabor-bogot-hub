import { useState, useEffect } from "react";
import { User, LogOut, Edit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLocalidades, useBarriosPorLocalidad } from "@/hooks/useBarriosBogota";
import { LocationCombobox } from "@/components/LocationCombobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const profileSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(100),
  apellidos: z.string().max(100).optional(),
  telefono: z.string().max(20).optional(),
  id_localidad: z.string().optional(),
  id_barrio: z.string().optional(),
  presupuesto: z.string().optional(),
  tipo_comida: z.array(z.string()).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const preferences = [
  "Mexicana", "Italiana", "Colombiana", "China", "Japonesa",
  "Vegana", "Vegetariana", "Parrilla", "Mariscos", "Postres"
];

const Perfil = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("busquedas");
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [busquedas, setBusquedas] = useState<any[]>([]);
  const [resenas, setResenas] = useState<any[]>([]);
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocalidadId, setSelectedLocalidadId] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nombre: "",
      apellidos: "",
      telefono: "",
      id_localidad: "",
      id_barrio: "",
      presupuesto: "",
      tipo_comida: [],
    },
  });

  // Cargar localidades y barrios
  const { data: localidades = [], isLoading: loadingLocalidades } = useLocalidades();
  const { data: barrios = [], isLoading: loadingBarrios } = useBarriosPorLocalidad(selectedLocalidadId);

  useEffect(() => {
    /* console.log('🎯 Perfil - useEffect ejecutado', {
      user: user?.email,
      authLoading
    }); */

    if (authLoading || !user) {
      /* console.log('🎯 Perfil - Esperando autenticación...'); */
      return;
    }

    const fetchUserData = async () => {
      try {
        /* console.log('🎯 Perfil - Iniciando fetchUserData'); */
        setLoading(true);

        // Obtener datos del usuario desde la tabla usuario con datos relacionales
        const { data: userProfile, error: userError } = await supabase
          .from("usuario")
          .select(`
            *,
            localidad:id_localidad(id_localidad, numero, nombre),
            barrio:id_barrio(id_barrio, nombre)
          `)
          .eq("id", user.id)
          .maybeSingle();

        if (userError) throw userError;

        // Si no existe registro en usuario, crear uno básico
        let baseProfile;
        if (!userProfile) {
          // Crear perfil inicial
          const { data: newProfile, error: insertError } = await supabase
            .from("usuario")
            .insert({
              id: user.id,
              nombre: user.user_metadata?.nombre || user.email?.split("@")[0] || "Usuario",
              email: user.email,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          baseProfile = newProfile;
        } else {
          baseProfile = userProfile;
        }

        /* console.log('🎯 Perfil - Perfil cargado:', baseProfile); */
        setUserData(baseProfile);

        // Actualizar valores del formulario
        form.reset({
          nombre: baseProfile.nombre || "",
          apellidos: baseProfile.apellidos || "",
          telefono: baseProfile.telefono || "",
          id_localidad: baseProfile.id_localidad || "",
          id_barrio: baseProfile.id_barrio || "",
          presupuesto: baseProfile.presupuesto || "",
          tipo_comida: baseProfile.tipo_comida || [],
        });

        // Establecer localidad seleccionada para cargar barrios
        if (baseProfile.id_localidad) {
          setSelectedLocalidadId(baseProfile.id_localidad);
        }

        // Obtener historial de búsquedas
        const { data: searchHistory, error: searchError } = await supabase
          .from('historial_busqueda')
          .select('*')
          .eq('id_usuario', user.id)
          .order('fecha', { ascending: false })
          .limit(10);

        if (!searchError && searchHistory) {
          setBusquedas(searchHistory);
        }

        // Obtener reseñas
        const { data: reviews, error: reviewsError } = await supabase
          .from('resena')
          .select('*')
          .eq('id_usuario', user.id)
          .order('fecha_resena', { ascending: false })
          .limit(10);

        if (!reviewsError && reviews) {
          setResenas(reviews);
        }

        // Obtener favoritos
        const { data: favs, error: favsError } = await supabase
          .from('favorito')
          .select('*')
          .eq('id_usuario', user.id)
          .order('fecha_agregado', { ascending: false })
          .limit(10);

        if (!favsError && favs) {
          setFavoritos(favs);
        }

        /* console.log('🎯 Perfil - Datos cargados exitosamente'); */
      } catch (error) {
        /* console.error('🎯 Perfil - Error fetching user data:', error); */
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del perfil",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, authLoading, navigate, form]);

  const handleEditProfile = () => {
    setIsEditDialogOpen(true);
  };

  const togglePreference = (preference: string) => {
    const currentPreferences = form.getValues("tipo_comida") || [];
    const newPreferences = currentPreferences.includes(preference)
      ? currentPreferences.filter((p) => p !== preference)
      : [...currentPreferences, preference];
    form.setValue("tipo_comida", newPreferences);
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const updateData = {
        id: user.id,
        nombre: data.nombre,
        apellidos: data.apellidos || null,
        telefono: data.telefono || null,
        id_localidad: data.id_localidad || null,
        id_barrio: data.id_barrio || null,
        presupuesto: data.presupuesto || null,
        tipo_comida: data.tipo_comida || [],
        email: user.email,
      };

      /* console.log('🎯 Actualizando perfil con datos:', updateData); */

      const { error } = await supabase
        .from("usuario")
        .upsert(updateData, {
          onConflict: 'id'
        });

      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw error;
      }

      setUserData(prev => ({
        ...prev,
        ...updateData
      }));

      toast({
        title: "✅ Perfil actualizado",
        description: "Tus datos se han guardado correctamente",
      });

      setIsEditDialogOpen(false);

    } catch (error: any) {
      console.error("❌ Error actualizando perfil:", error);

      let errorMessage = "No se pudo actualizar el perfil";
      if (error.message?.includes('row-level security')) {
        errorMessage = "Error de permisos. Verifica las políticas RLS de Supabase.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/login');
    } else {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    /* console.log('🎯 Perfil - Mostrando loading', { authLoading, loading }); */
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No se pudo cargar la información del perfil.</p>
      </div>
    );
  }

  const nombreCompleto = `${userData.nombre || ''} ${userData.apellidos || ''}`.trim() || 'Usuario';
  const tipoComidaArray = userData.tipo_comida || [];

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Avatar y Datos del Usuario */}
        <div className="flex flex-col items-center mb-8">
          <Avatar className="h-32 w-32 mb-4 border-4 border-primary/10">
            <AvatarImage src={userData.foto_url || user?.user_metadata?.avatar_url} alt={nombreCompleto} />
            <AvatarFallback className="text-3xl bg-primary/10 text-primary">
              {nombreCompleto.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {nombreCompleto}
          </h1>
          <p className="text-primary font-medium">
            {userData.email || user?.email}
          </p>
        </div>

        {/* Preferencias Gastronómicas */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Mis preferencias gastronómicas
          </h2>

          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Tipo de comida */}
              <div className="space-y-2">
                <Label htmlFor="tipo-comida" className="text-foreground font-medium">
                  Tipos de comida favoritos
                </Label>
                <div className="text-sm text-muted-foreground">
                  {tipoComidaArray.length > 0 ? tipoComidaArray.join(', ') : 'No especificado'}
                </div>
              </div>

              {/* Presupuesto */}
              <div className="space-y-2">
                <Label htmlFor="presupuesto" className="text-foreground font-medium">
                  Presupuesto
                </Label>
                <div className="text-sm text-muted-foreground capitalize">
                  {userData.presupuesto || 'No especificado'}
                </div>
              </div>

              {/* Ubicación */}
              <div className="space-y-2">
                <Label htmlFor="ubicacion" className="text-foreground font-medium">
                  Ubicación
                </Label>
                <div className="text-sm text-muted-foreground">
                  {userData.localidad?.nombre && userData.barrio?.nombre
                    ? `${userData.barrio.nombre}, ${userData.localidad.nombre}`
                    : 'No especificado'}
                </div>
              </div>

              {/* Teléfono */}
              {userData.telefono && (
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">
                    Teléfono
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    {userData.telefono}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Historial */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Historial
          </h2>

          <Card>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="busquedas">Búsquedas</TabsTrigger>
                  <TabsTrigger value="resenas">Reseñas</TabsTrigger>
                  <TabsTrigger value="favoritos">Favoritos</TabsTrigger>
                </TabsList>

                <TabsContent value="busquedas" className="mt-6">
                  <div className="space-y-3">
                    {busquedas.length > 0 ? (
                      busquedas.map((busqueda) => (
                        <div
                          key={busqueda.id_busqueda}
                          className="py-3 border-b border-border last:border-0 text-foreground hover:text-primary cursor-pointer transition-colors"
                          onClick={() => navigate('/historial/busquedas')}
                        >
                          <div className="font-medium">{busqueda.query}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(busqueda.fecha).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-6">
                        No tienes búsquedas recientes
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="resenas" className="mt-6">
                  <div className="space-y-3">
                    {resenas.length > 0 ? (
                      resenas.map((resena) => (
                        <div
                          key={resena.id_resena}
                          className="py-3 border-b border-border last:border-0 text-foreground hover:text-primary cursor-pointer transition-colors"
                          onClick={() => navigate('/resenas')}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{resena.place_id}</div>
                            <div className="text-sm">⭐ {resena.calificacion}/5</div>
                          </div>
                          {resena.comentario && (
                            <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {resena.comentario}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-6">
                        No has dejado reseñas aún
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="favoritos" className="mt-6">
                  <div className="space-y-3">
                    {favoritos.length > 0 ? (
                      favoritos.map((favorito) => (
                        <div
                          key={favorito.id_favorito}
                          className="py-3 border-b border-border last:border-0 text-foreground hover:text-primary cursor-pointer transition-colors"
                          onClick={() => navigate('/favoritos')}
                        >
                          <div className="font-medium">{favorito.place_id}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(favorito.fecha_agregado).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-6">
                        No tienes favoritos guardados
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleEditProfile}
          >
            <Edit className="h-4 w-4" />
            Editar perfil
          </Button>
          <Button
            variant="destructive"
            className="flex-1 gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>

      {/* Diálogo de Edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apellidos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos</FormLabel>
                    <FormControl>
                      <Input placeholder="Tus apellidos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+57 123 456 7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Localidad */}
              <FormField
                control={form.control}
                name="id_localidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localidad</FormLabel>
                    <FormControl>
                      <LocationCombobox
                        options={localidades.map(l => ({
                          value: l.id_localidad,
                          label: `${l.numero}. ${l.nombre}`
                        }))}
                        value={field.value || ""}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedLocalidadId(value);
                          // Limpiar barrio cuando se cambia localidad
                          form.setValue('id_barrio', '');
                        }}
                        placeholder="Selecciona tu localidad"
                        searchPlaceholder="Buscar localidad..."
                        emptyText="No se encontró la localidad"
                        disabled={loadingLocalidades}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Barrio */}
              <FormField
                control={form.control}
                name="id_barrio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barrio</FormLabel>
                    <FormControl>
                      <LocationCombobox
                        options={barrios.map(b => ({
                          value: b.id_barrio,
                          label: b.nombre
                        }))}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder={
                          !selectedLocalidadId 
                            ? "Primero selecciona una localidad" 
                            : "Selecciona tu barrio"
                        }
                        searchPlaceholder="Buscar barrio..."
                        emptyText="No se encontró el barrio"
                        disabled={!selectedLocalidadId || loadingBarrios}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="presupuesto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presupuesto</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu presupuesto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="económico">Económico ($)</SelectItem>
                        <SelectItem value="moderado">Moderado ($$)</SelectItem>
                        <SelectItem value="alto">Alto ($$$)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_comida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipos de comida favoritos</FormLabel>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {preferences.map((preference) => {
                        const isSelected = (field.value || []).includes(preference);
                        return (
                          <Badge
                            key={preference}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer justify-center py-2 hover:bg-primary/80 transition-colors"
                            onClick={() => togglePreference(preference)}
                          >
                            {preference}
                          </Badge>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Perfil;