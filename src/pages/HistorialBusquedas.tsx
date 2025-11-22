import { Search, Clock, ExternalLink, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Busqueda {
  id_busqueda: string;
  id_conversacion?: string;
  query: string;
  fecha: string;
  tipo: "Chat IA" | "Búsqueda";
  resultados: number;
  messages?: any[];
}

const HistorialBusquedas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busquedas, setBusquedas] = useState<Busqueda[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistorial();
  }, []);

  const fetchHistorial = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('historial_busqueda')
        .select(`
          id_busqueda,
          id_conversacion,
          query,
          fecha,
          resultado_busqueda (
            id_resultado
          )
        `)
        .eq('id_usuario', user.id)
        .order('fecha', { ascending: false });

      if (error) throw error;

      const formattedData: Busqueda[] = (data || []).map((item: any) => ({
        id_busqueda: item.id_busqueda,
        id_conversacion: item.id_conversacion,
        query: item.query,
        fecha: new Date(item.fecha).toLocaleString('es-CO'),
        tipo: "Chat IA",
        resultados: item.resultado_busqueda?.length || 0,
        messages: []
      }));

      setBusquedas(formattedData);
    } catch (error) {
      console.error('Error fetching historial:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewResults = (id_busqueda: string) => {
    navigate('/restaurantes', { state: { searchId: id_busqueda } });
  };

  const handleLoadConversation = (busqueda: Busqueda) => {
    if (!busqueda.id_conversacion) {
      toast({
        title: "Error",
        description: "Esta conversación no tiene ID asociado",
        variant: "destructive"
      });
      return;
    }

    // Navegar al chat con el ID de conversación
    navigate('/chat-ia', { 
      state: { 
        loadConversation: true,
        conversationId: busqueda.id_conversacion
      } 
    });
  };

  const handleDeleteSearch = async (id_busqueda: string) => {
    try {
      const { error } = await supabase
        .from('historial_busqueda')
        .delete()
        .eq('id_busqueda', id_busqueda);

      if (error) throw error;

      toast({
        title: "Búsqueda eliminada",
        description: "La búsqueda se eliminó correctamente"
      });

      fetchHistorial();
    } catch (error) {
      console.error('Error deleting search:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la búsqueda",
        variant: "destructive"
      });
    }
  };

  const handleClearHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('historial_busqueda')
        .delete()
        .eq('id_usuario', user.id);

      if (error) throw error;

      toast({
        title: "Historial limpiado",
        description: "Todo el historial se eliminó correctamente"
      });

      fetchHistorial();
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: "Error",
        description: "No se pudo limpiar el historial",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-8 w-8 text-primary" />
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Historial de Búsquedas y Recomendaciones
                </h1>
              </div>
              <p className="text-muted-foreground">
                Revisa todas tus consultas anteriores y sus resultados
              </p>
            </div>
            
            <Button 
              variant="destructive"
              onClick={handleClearHistory}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar historial
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando historial...</p>
          </div>
        ) : busquedas.length > 0 ? (
          <>
            {/* Stats Card */}
            <Card className="mb-8 bg-muted/50">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total de Búsquedas</p>
                    <p className="text-3xl font-bold text-foreground">{busquedas.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Consultas al Chat IA</p>
                    <p className="text-3xl font-bold text-foreground">
                      {busquedas.filter(b => b.tipo === "Chat IA").length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Resultados Totales</p>
                    <p className="text-3xl font-bold text-foreground">
                      {busquedas.reduce((acc, b) => acc + b.resultados, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Vista de Desktop - Tabla */}
            <Card className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Consulta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-center">Resultados</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {busquedas.map((busqueda) => (
                    <TableRow key={busqueda.id_busqueda}>
                      <TableCell className="font-medium">
                        <div className="flex items-start gap-2">
                          <Search className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                          <span className="text-foreground">{busqueda.query}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={busqueda.tipo === "Chat IA" ? "default" : "secondary"}>
                          {busqueda.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {busqueda.fecha}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {busqueda.resultados} lugares
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {busqueda.tipo === "Chat IA" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleLoadConversation(busqueda)}
                              className="gap-2"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Cargar Chat
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewResults(busqueda.id_busqueda)}
                            className="gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Ver Resultados
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSearch(busqueda.id_busqueda)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Vista de Mobile - Cards */}
            <div className="md:hidden space-y-4">
              {busquedas.map((busqueda) => (
                <Card key={busqueda.id_busqueda}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Search className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <p className="font-medium text-foreground flex-1">
                          {busqueda.query}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={busqueda.tipo === "Chat IA" ? "default" : "secondary"}>
                          {busqueda.tipo}
                        </Badge>
                        <Badge variant="outline">
                          {busqueda.resultados} resultados
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {busqueda.fecha}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {busqueda.tipo === "Chat IA" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleLoadConversation(busqueda)}
                            className="w-full gap-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Cargar Chat
                          </Button>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewResults(busqueda.id_busqueda)}
                            className="flex-1 gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Ver Resultados
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSearch(busqueda.id_busqueda)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          // Estado vacío
          <Card className="p-12">
            <div className="text-center max-w-md mx-auto">
              <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No hay búsquedas en el historial
              </h3>
              <p className="text-muted-foreground mb-6">
                Empieza a explorar restaurantes o usa el Chat IA para obtener recomendaciones personalizadas
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/restaurantes')}>
                  Explorar Restaurantes
                </Button>
                <Button variant="outline" onClick={() => navigate('/chatia')}>
                  Usar Chat IA
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HistorialBusquedas;

