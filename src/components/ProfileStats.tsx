import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Search, Star, Heart, TrendingUp } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface ProfileStatsProps {
  busquedasCount: number;
  resenasCount: number;
  favoritosCount: number;
  tipoComidaPreferences: string[];
}

const useScrollReveal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isVisible };
};


export const ProfileStats = ({ 
  busquedasCount, 
  resenasCount, 
  favoritosCount,
  tipoComidaPreferences 
}: ProfileStatsProps) => {
  
  const { ref: statsRef, isVisible: statsVisible } = useScrollReveal();
  const { ref: badgesRef, isVisible: badgesVisible } = useScrollReveal();
  const { ref: prefsRef, isVisible: prefsVisible } = useScrollReveal();
  
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

  const earnedBadges = badges.filter(b => b.earned);
  const pendingBadges = badges.filter(b => !b.earned);

  const maxValue = Math.max(busquedasCount, resenasCount, favoritosCount, 1);

  return (
    <div className="space-y-6">
      {/* Resumen de actividad */}
      <Card 
        ref={statsRef} 
        className={`transition-all duration-700 ${
          statsVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tu Actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* Búsquedas */}
            <div 
              className={`text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 transition-all duration-500 delay-100 ${
                statsVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              <div className="mb-3 inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <div className="text-4xl font-bold text-primary mb-1">{busquedasCount}</div>
              <div className="text-sm text-muted-foreground font-medium">Búsquedas</div>
              {/* Barra de progreso */}
              <div className="mt-3 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-out"
                  style={{ 
                    width: statsVisible ? `${(busquedasCount / maxValue) * 100}%` : '0%',
                    transitionDelay: '200ms'
                  }}
                />
              </div>
            </div>

            {/* Reseñas */}
            <div 
              className={`text-center p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl border border-secondary/20 transition-all duration-500 delay-200 ${
                statsVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              <div className="mb-3 inline-flex items-center justify-center w-12 h-12 bg-secondary/20 rounded-full">
                <Star className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-4xl font-bold text-secondary mb-1">{resenasCount}</div>
              <div className="text-sm text-muted-foreground font-medium">Reseñas</div>
              {/* Barra de progreso */}
              <div className="mt-3 h-1.5 bg-secondary/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-secondary transition-all duration-1000 ease-out"
                  style={{ 
                    width: statsVisible ? `${(resenasCount / maxValue) * 100}%` : '0%',
                    transitionDelay: '300ms'
                  }}
                />
              </div>
            </div>

            {/* Favoritos */}
            <div 
              className={`text-center p-6 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/20 transition-all duration-500 delay-300 ${
                statsVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              <div className="mb-3 inline-flex items-center justify-center w-12 h-12 bg-accent/20 rounded-full">
                <Heart className="w-6 h-6 text-accent" />
              </div>
              <div className="text-4xl font-bold text-accent mb-1">{favoritosCount}</div>
              <div className="text-sm text-muted-foreground font-medium">Favoritos</div>
              {/* Barra de progreso */}
              <div className="mt-3 h-1.5 bg-accent/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-1000 ease-out"
                  style={{ 
                    width: statsVisible ? `${(favoritosCount / maxValue) * 100}%` : '0%',
                    transitionDelay: '400ms'
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges/Logros */}
      <Card 
        ref={badgesRef}
        className={`transition-all duration-700 delay-200 ${
          badgesVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
      >
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
      {tipoComidaPreferences.length > 0 && (
        <Card 
          ref={prefsRef}
          className={`transition-all duration-700 delay-300 ${
            prefsVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
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
