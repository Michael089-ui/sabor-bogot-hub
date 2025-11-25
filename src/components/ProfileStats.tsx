import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Search, Star, Heart, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface ProfileStatsProps {
  busquedasCount: number;
  resenasCount: number;
  favoritosCount: number;
  tipoComidaPreferences: string[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const ProfileStats = ({ 
  busquedasCount, 
  resenasCount, 
  favoritosCount,
  tipoComidaPreferences 
}: ProfileStatsProps) => {
  
  // Calcular badges ganados
  const badges = [
    {
      id: 'explorador',
      name: 'Explorador',
      description: 'Realiza 10 búsquedas',
      icon: Search,
      earned: busquedasCount >= 10,
      progress: Math.min(busquedasCount, 10),
      total: 10
    },
    {
      id: 'critico',
      name: 'Crítico Gastronómico',
      description: 'Escribe 5 reseñas',
      icon: Star,
      earned: resenasCount >= 5,
      progress: Math.min(resenasCount, 5),
      total: 5
    },
    {
      id: 'conocedor',
      name: 'Conocedor',
      description: 'Guarda 5 favoritos',
      icon: Heart,
      earned: favoritosCount >= 5,
      progress: Math.min(favoritosCount, 5),
      total: 5
    },
    {
      id: 'maestro',
      name: 'Maestro Sabor',
      description: 'Completa todas las insignias',
      icon: Award,
      earned: busquedasCount >= 10 && resenasCount >= 5 && favoritosCount >= 5,
      progress: [busquedasCount >= 10, resenasCount >= 5, favoritosCount >= 5].filter(Boolean).length,
      total: 3
    }
  ];

  // Datos para gráfico de actividad
  const activityData = [
    { name: 'Búsquedas', value: busquedasCount },
    { name: 'Reseñas', value: resenasCount },
    { name: 'Favoritos', value: favoritosCount },
  ];

  // Datos para gráfico de preferencias
  const preferencesData = tipoComidaPreferences.slice(0, 4).map((pref, index) => ({
    name: pref,
    value: 1,
  }));

  const earnedBadges = badges.filter(b => b.earned);
  const pendingBadges = badges.filter(b => !b.earned);

  return (
    <div className="space-y-6">
      {/* Resumen de actividad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tu Actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-3xl font-bold text-primary">{busquedasCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Búsquedas</div>
            </div>
            <div className="text-center p-4 bg-secondary/5 rounded-lg">
              <div className="text-3xl font-bold text-secondary">{resenasCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Reseñas</div>
            </div>
            <div className="text-center p-4 bg-accent/5 rounded-lg">
              <div className="text-3xl font-bold text-accent">{favoritosCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Favoritos</div>
            </div>
          </div>

          {/* Gráfico de barras */}
          {(busquedasCount > 0 || resenasCount > 0 || favoritosCount > 0) && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Badges/Logros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Insignias ({earnedBadges.length}/{badges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Insignias ganadas */}
          {earnedBadges.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-3">Desbloqueadas</h3>
              <div className="grid grid-cols-2 gap-3">
                {earnedBadges.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div
                      key={badge.id}
                      className="flex items-start gap-3 p-3 bg-primary/10 border-2 border-primary/20 rounded-lg"
                    >
                      <div className="p-2 bg-primary/20 rounded-full">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm">{badge.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{badge.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Insignias pendientes */}
          {pendingBadges.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Por desbloquear</h3>
              <div className="space-y-3">
                {pendingBadges.map((badge) => {
                  const Icon = badge.icon;
                  const progressPercent = (badge.progress / badge.total) * 100;
                  return (
                    <div
                      key={badge.id}
                      className="flex items-start gap-3 p-3 bg-muted/30 border border-border rounded-lg"
                    >
                      <div className="p-2 bg-muted rounded-full opacity-50">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-muted-foreground text-sm">{badge.name}</div>
                        <div className="text-xs text-muted-foreground/70 mt-0.5">{badge.description}</div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progreso</span>
                            <span className="font-medium">{badge.progress}/{badge.total}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary/50 transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferencias visuales */}
      {preferencesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tus Preferencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tipoComidaPreferences.map((pref, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {pref}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
