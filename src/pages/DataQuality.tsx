import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDataQuality, useNeighborhoodCoverage, useDiscoverRestaurants, useEnrichAllWithAI } from "@/hooks/useDataQuality";
import { Search, Sparkles, Image, CheckCircle, TrendingUp, MapPin, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PRIORITY_NEIGHBORHOODS = [
  { name: "Chapinero Alto", location: { lat: 4.6500, lng: -74.0600 } },
  { name: "Usaquén", location: { lat: 4.7281, lng: -74.0306 } },
  { name: "Zona Rosa", location: { lat: 4.6642, lng: -74.0572 } },
  { name: "Parque 93", location: { lat: 4.6732, lng: -74.0488 } },
  { name: "Zona G", location: { lat: 4.6533, lng: -74.0569 } },
];

export default function DataQuality() {
  const { data: metrics, isLoading } = useDataQuality();
  const { data: coverage } = useNeighborhoodCoverage();
  const discoverMutation = useDiscoverRestaurants();
  const enrichAllMutation = useEnrichAllWithAI();
  
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(PRIORITY_NEIGHBORHOODS[0].name);

  const handleDiscover = () => {
    const neighborhood = PRIORITY_NEIGHBORHOODS.find(n => n.name === selectedNeighborhood);
    if (neighborhood) {
      discoverMutation.mutate({
        neighborhood: neighborhood.name,
        location: neighborhood.location,
        radius: 2000
      });
    }
  };

  const handleEnrichAll = () => {
    enrichAllMutation.mutate();
  };

  if (isLoading || !metrics) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const photoPercentage = Math.round((metrics.withPhotos / metrics.total) * 100);
  const descriptionPercentage = Math.round((metrics.withDescriptions / metrics.total) * 100);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Calidad de Datos</h1>
        <p className="text-muted-foreground">
          Monitor y mejora la calidad de la base de datos de restaurantes
        </p>
      </div>

      {/* Métricas Generales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Restaurantes</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">
              En {metrics.neighborhoods} barrios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Fotos</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.withPhotos}</div>
            <p className="text-xs text-muted-foreground">
              {photoPercentage}% del total
            </p>
            {photoPercentage < 50 && (
              <Badge variant="destructive" className="mt-2">Necesita mejora</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Descripciones</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.withDescriptions}</div>
            <p className="text-xs text-muted-foreground">
              {descriptionPercentage}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actualizados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.recentlyUpdated}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Barrios Cubiertos</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.neighborhoods}</div>
            <p className="text-xs text-muted-foreground">
              Zonas de Bogotá
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calidad Global</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.qualityScore}/100</div>
            <p className="text-xs text-muted-foreground">
              Score de calidad
            </p>
            {metrics.qualityScore >= 80 && <Badge className="mt-2">Excelente</Badge>}
            {metrics.qualityScore >= 60 && metrics.qualityScore < 80 && <Badge variant="secondary" className="mt-2">Buena</Badge>}
            {metrics.qualityScore < 60 && <Badge variant="destructive" className="mt-2">Necesita mejora</Badge>}
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Descubrir Nuevos Restaurantes
            </CardTitle>
            <CardDescription>
              Buscar restaurantes en Places API por barrios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Seleccionar Barrio</label>
              <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_NEIGHBORHOODS.map((n) => (
                    <SelectItem key={n.name} value={n.name}>
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleDiscover} 
              disabled={discoverMutation.isPending}
              className="w-full"
            >
              {discoverMutation.isPending ? 'Descubriendo...' : 'Iniciar Descubrimiento'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Enriquecer con IA (Gemini)
            </CardTitle>
            <CardDescription>
              Generar descripciones para restaurantes sin descripción
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {metrics.total - metrics.withDescriptions} restaurantes sin descripción
            </p>
            <Button 
              onClick={handleEnrichAll}
              disabled={enrichAllMutation.isPending || metrics.withDescriptions === metrics.total}
              className="w-full"
            >
              {enrichAllMutation.isPending ? 'Enriqueciendo...' : 'Enriquecer Todos'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Cobertura por Barrio */}
      <Card>
        <CardHeader>
          <CardTitle>Cobertura por Barrio</CardTitle>
          <CardDescription>
            Distribución y calidad de datos por zona
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Barrio</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Con Fotos</TableHead>
                <TableHead className="text-right">Con Descripciones</TableHead>
                <TableHead className="text-right">Rating Promedio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coverage?.map((item) => (
                <TableRow key={item.neighborhood}>
                  <TableCell className="font-medium">{item.neighborhood}</TableCell>
                  <TableCell className="text-right">{item.total}</TableCell>
                  <TableCell className="text-right">
                    {item.withPhotos} ({Math.round((item.withPhotos / item.total) * 100)}%)
                  </TableCell>
                  <TableCell className="text-right">
                    {item.withDescriptions} ({Math.round((item.withDescriptions / item.total) * 100)}%)
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {item.avgRating.toFixed(1)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
