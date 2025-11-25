import { ArrowLeft, Star, TrendingUp, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import { useRestaurantDetail } from "@/hooks/useRestaurants";
import { useRestaurantReviews } from "@/hooks/useReviews";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo } from "react";

const EstadisticasRestaurante = () => {
  const navigate = useNavigate();
  const { id: placeId } = useParams<{ id: string }>();
  const { data: restaurant, isLoading: isLoadingRestaurant } = useRestaurantDetail(placeId);
  const { data: reviews, isLoading: isLoadingReviews } = useRestaurantReviews(placeId);

  // Calcular distribución de calificaciones
  const ratingDistribution = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];

    const distribution = [
      { stars: 5, count: 0, percentage: 0 },
      { stars: 4, count: 0, percentage: 0 },
      { stars: 3, count: 0, percentage: 0 },
      { stars: 2, count: 0, percentage: 0 },
      { stars: 1, count: 0, percentage: 0 },
    ];

    reviews.forEach((review) => {
      if (review.calificacion) {
        const index = 5 - review.calificacion;
        distribution[index].count++;
      }
    });

    const total = reviews.length;
    distribution.forEach((item) => {
      item.percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
    });

    return distribution;
  }, [reviews]);

  // Calcular evolución del rating por mes
  const ratingEvolution = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];

    const reviewsByMonth: { [key: string]: { total: number; count: number } } = {};

    reviews.forEach((review) => {
      if (review.fecha_resena && review.calificacion) {
        const date = new Date(review.fecha_resena);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        
        if (!reviewsByMonth[monthKey]) {
          reviewsByMonth[monthKey] = { total: 0, count: 0 };
        }
        
        reviewsByMonth[monthKey].total += review.calificacion;
        reviewsByMonth[monthKey].count++;
      }
    });

    const evolution = Object.entries(reviewsByMonth)
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("es-CO", { year: "numeric", month: "short" }),
        rating: Number((data.total / data.count).toFixed(1)),
        reviews: data.count,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });

    return evolution;
  }, [reviews]);

  // Calcular estadísticas generales
  const stats = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return {
        avgRating: 0,
        totalReviews: 0,
        lastMonthReviews: 0,
        trend: 0,
      };
    }

    const avgRating = reviews.reduce((sum, r) => sum + (r.calificacion || 0), 0) / reviews.length;
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    const lastMonthReviews = reviews.filter((r) => {
      if (!r.fecha_resena) return false;
      const reviewDate = new Date(r.fecha_resena);
      return reviewDate >= lastMonth;
    }).length;

    // Calcular tendencia comparando últimos 2 meses
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    const lastTwoMonths = reviews.filter((r) => {
      if (!r.fecha_resena) return false;
      const reviewDate = new Date(r.fecha_resena);
      return reviewDate >= twoMonthsAgo;
    });

    const recentAvg = lastTwoMonths.slice(0, Math.floor(lastTwoMonths.length / 2))
      .reduce((sum, r) => sum + (r.calificacion || 0), 0) / Math.max(1, Math.floor(lastTwoMonths.length / 2));
    
    const olderAvg = lastTwoMonths.slice(Math.floor(lastTwoMonths.length / 2))
      .reduce((sum, r) => sum + (r.calificacion || 0), 0) / Math.max(1, lastTwoMonths.length - Math.floor(lastTwoMonths.length / 2));

    const trend = recentAvg - olderAvg;

    return {
      avgRating: Number(avgRating.toFixed(1)),
      totalReviews: reviews.length,
      lastMonthReviews,
      trend: Number(trend.toFixed(1)),
    };
  }, [reviews]);

  if (isLoadingRestaurant || isLoadingReviews) {
    return (
      <div className="min-h-full bg-background">
        <div className="border-b border-border bg-card px-6 py-4">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <div className="grid md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Restaurante no encontrado
          </h2>
          <Button onClick={() => navigate("/restaurantes")}>
            Volver a Restaurantes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/restaurantes/${placeId}`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Restaurante
        </Button>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Estadísticas de {restaurant.name}
          </h1>
          <p className="text-muted-foreground">
            Análisis de reseñas y calificaciones de la comunidad Sabor Capital
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Calificación Promedio
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.avgRating}</div>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-4 w-4 ${star <= Math.round(stats.avgRating) ? 'fill-yellow-500 text-yellow-500' : 'text-muted'}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Reseñas
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalReviews}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Reseñas de la comunidad
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Último Mes
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.lastMonthReviews}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Reseñas nuevas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tendencia
              </CardTitle>
              <TrendingUp className={`h-4 w-4 ${stats.trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.trend >= 0 ? '+' : ''}{stats.trend}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Últimos 2 meses
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {reviews && reviews.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Rating Evolution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Evolución del Rating</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Calificación promedio por mes
                </p>
              </CardHeader>
              <CardContent>
                {ratingEvolution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={ratingEvolution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        domain={[0, 5]} 
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="rating" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Rating"
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No hay suficientes datos para mostrar la evolución
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rating Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Calificaciones</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Porcentaje por número de estrellas
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ratingDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      dataKey="stars" 
                      type="category"
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `${value} ⭐`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'percentage') return [`${value}%`, 'Porcentaje'];
                        return [value, 'Cantidad'];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Cantidad" />
                    <Bar dataKey="percentage" fill="hsl(var(--chart-2))" name="Porcentaje (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="mb-8">
            <CardContent className="p-12 text-center">
              <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No hay suficientes datos
              </h3>
              <p className="text-muted-foreground mb-4">
                Este restaurante aún no tiene reseñas de la comunidad para generar estadísticas.
                Sé el primero en dejar una reseña.
              </p>
              <Button onClick={() => navigate(`/restaurantes/${placeId}`)}>
                Ir al Restaurante
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Additional Stats */}
        {reviews && reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detalles de Distribución</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ratingDistribution.map((item) => (
                  <div key={item.stars} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 w-20">
                      <span className="font-medium">{item.stars}</span>
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <div className="h-6 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right">
                      <span className="font-medium">{item.count}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EstadisticasRestaurante;
