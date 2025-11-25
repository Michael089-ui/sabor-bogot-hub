import { Star, MessageSquare, Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useUserReviews, useDeleteReview, useUpdateReview } from "@/hooks/useReviews";
import { ReviewModal } from "@/components/ReviewModal";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ResenaCardProps {
  id: string;
  restaurante: string;
  calificacion: number;
  comentario: string;
  fecha: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ResenaCard = ({ 
  id, 
  restaurante, 
  calificacion, 
  comentario, 
  fecha,
  onEdit,
  onDelete 
}: ResenaCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-2">
              {restaurante}
            </h3>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-4 w-4 ${
                      star <= calificacion 
                        ? 'fill-yellow-500 text-yellow-500' 
                        : 'text-muted'
                    }`}
                  />
                ))}
              </div>
              <Badge variant="secondary" className="text-xs">
                {fecha}
              </Badge>
            </div>
            
            <p className="text-muted-foreground">
              {comentario}
            </p>
          </div>

          <div className="flex md:flex-col gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(id)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onDelete(id)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Resenas = () => {
  const navigate = useNavigate();
  const { data: reviews, isLoading } = useUserReviews();
  const deleteReview = useDeleteReview();
  const updateReview = useUpdateReview();
  
  const [editingReview, setEditingReview] = useState<{ id: string; rating: number; comment: string; placeId: string; restaurantName: string } | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const handleEditResena = (id: string) => {
    const review = reviews?.find((r) => r.id_resena === id);
    if (review) {
      setEditingReview({
        id: review.id_resena,
        rating: review.calificacion || 0,
        comment: review.comentario || "",
        placeId: review.place_id,
        restaurantName: "Restaurante" // TODO: Fetch restaurant name
      });
    }
  };

  const handleDeleteResena = (id: string) => {
    setDeletingReviewId(id);
  };

  const confirmDelete = () => {
    if (deletingReviewId) {
      deleteReview.mutate(deletingReviewId);
      setDeletingReviewId(null);
    }
  };

  const handleUpdateReview = (data: { calificacion: number; comentario: string; reviewId?: string }) => {
    if (data.reviewId) {
      updateReview.mutate(
        { id_resena: data.reviewId, calificacion: data.calificacion, comentario: data.comentario },
        { onSuccess: () => setEditingReview(null) }
      );
    }
  };

  const handleNewResena = () => {
    navigate('/restaurantes');
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "Fecha desconocida";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} años`;
  };

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.calificacion || 0), 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Mis Reseñas y Contribuciones
                </h1>
              </div>
              <p className="text-muted-foreground">
                Comparte tu experiencia y ayuda a otros a descubrir los mejores lugares
              </p>
            </div>
            
            <Button 
              size="lg"
              onClick={handleNewResena}
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              Escribir nueva reseña
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reviews && reviews.length > 0 ? (
          <>
            {/* Stats Card */}
            <Card className="mb-8 bg-muted/50">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total de Reseñas</p>
                    <p className="text-3xl font-bold text-foreground">{reviews.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Calificación Promedio</p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold text-foreground">{avgRating}</p>
                      <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Restaurantes Evaluados</p>
                    <p className="text-3xl font-bold text-foreground">{reviews.length}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Lista de Reseñas */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <ResenaCard
                  key={review.id_resena}
                  id={review.id_resena}
                  restaurante="Restaurante" // TODO: Fetch restaurant name from place_id
                  calificacion={review.calificacion || 0}
                  comentario={review.comentario || ""}
                  fecha={formatRelativeTime(review.fecha_resena)}
                  onEdit={handleEditResena}
                  onDelete={handleDeleteResena}
                />
              ))}
            </div>
          </>
        ) : (
          // Estado vacío
          <Card className="p-12">
            <div className="text-center max-w-md mx-auto">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Aún no has escrito reseñas
              </h3>
              <p className="text-muted-foreground mb-6">
                Comparte tu experiencia en los restaurantes que has visitado y ayuda a la comunidad
              </p>
              <Button onClick={handleNewResena} className="gap-2">
                <Plus className="h-4 w-4" />
                Escribir mi primera reseña
              </Button>
            </div>
          </Card>
        )}

        {/* Edit Review Modal */}
        {editingReview && (
          <ReviewModal
            open={!!editingReview}
            onOpenChange={(open) => !open && setEditingReview(null)}
            restaurantName={editingReview.restaurantName}
            placeId={editingReview.placeId}
            initialRating={editingReview.rating}
            initialComment={editingReview.comment}
            reviewId={editingReview.id}
            onSubmit={handleUpdateReview}
            isLoading={updateReview.isPending}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingReviewId} onOpenChange={(open) => !open && setDeletingReviewId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar reseña?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La reseña será eliminada permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Resenas;
