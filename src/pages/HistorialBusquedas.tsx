import { Search, Clock, ExternalLink, Trash2 } from "lucide-react";
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

const HistorialBusquedas = () => {
  const navigate = useNavigate();

  // Mock data - historial de búsquedas del usuario
  const busquedas = [
    {
      id: 1,
      consulta: "¿Dónde comer arepas baratas en Chapinero?",
      fecha: "2025-01-15 14:30",
      resultados: 8,
      tipo: "Chat IA"
    },
    {
      id: 2,
      consulta: "Restaurantes románticos para cena",
      fecha: "2025-01-14 19:45",
      resultados: 12,
      tipo: "Chat IA"
    },
    {
      id: 3,
      consulta: "Comida vegetariana cerca de la Universidad Nacional",
      fecha: "2025-01-13 12:15",
      resultados: 6,
      tipo: "Chat IA"
    },
    {
      id: 4,
      consulta: "Mejores restaurantes de comida italiana",
      fecha: "2025-01-12 20:00",
      resultados: 15,
      tipo: "Búsqueda"
    },
    {
      id: 5,
      consulta: "Lugares para desayunar en La Candelaria",
      fecha: "2025-01-11 08:30",
      resultados: 10,
      tipo: "Chat IA"
    },
    {
      id: 6,
      consulta: "Restaurantes con terraza en Usaquén",
      fecha: "2025-01-10 16:20",
      resultados: 9,
      tipo: "Búsqueda"
    },
  ];

  const handleViewResults = (id: number) => {
    // TODO: Conectar con las tablas busqueda y resultado_busqueda
    console.log("Ver resultados de búsqueda:", id);
    navigate('/restaurantes');
  };

  const handleDeleteSearch = (id: number) => {
    // TODO: Conectar con la tabla busqueda
    console.log("Eliminar búsqueda:", id);
  };

  const handleClearHistory = () => {
    // TODO: Conectar con la tabla busqueda
    console.log("Limpiar historial completo");
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
        {busquedas.length > 0 ? (
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
                    <TableRow key={busqueda.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-start gap-2">
                          <Search className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                          <span className="text-foreground">{busqueda.consulta}</span>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewResults(busqueda.id)}
                            className="gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Ver Resultados
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSearch(busqueda.id)}
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
                <Card key={busqueda.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Search className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <p className="font-medium text-foreground flex-1">
                          {busqueda.consulta}
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

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewResults(busqueda.id)}
                          className="flex-1 gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ver Resultados
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSearch(busqueda.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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

