import { useState, useEffect } from "react";
import { User, LogOut, Edit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
import { useNavigate } from "react-router-dom";

const Perfil = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("busquedas");
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [busquedas, setBusquedas] = useState<any[]>([]);
  const [resenas, setResenas] = useState<any[]>([]);
  const [favoritos, setFavoritos] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        // Obtener datos del usuario
        const { data: userProfile, error: userError } = await supabase
          .from('usuario')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (userError) throw userError;
        setUserData(userProfile);

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
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate]);

  const handleEditProfile = () => {
    console.log("Editar perfil");
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
                  {userData.ubicacion || 'No especificado'}
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
                          onClick={() => navigate('/historial-busquedas')}
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
    </div>
  );
};

export default Perfil;

