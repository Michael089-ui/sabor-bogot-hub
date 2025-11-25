import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantName: string;
  placeId: string;
  initialRating?: number;
  initialComment?: string;
  reviewId?: string;
  onSubmit: (data: { calificacion: number; comentario: string; reviewId?: string }) => void;
  isLoading?: boolean;
}

export const ReviewModal = ({
  open,
  onOpenChange,
  restaurantName,
  placeId,
  initialRating = 0,
  initialComment = "",
  reviewId,
  onSubmit,
  isLoading = false,
}: ReviewModalProps) => {
  const [rating, setRating] = useState(initialRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(initialComment);

  useEffect(() => {
    if (open) {
      setRating(initialRating);
      setComment(initialComment);
    }
  }, [open, initialRating, initialComment]);

  const handleSubmit = () => {
    if (rating === 0) {
      return;
    }
    
    // Validar longitud del comentario
    const trimmedComment = comment.trim();
    if (trimmedComment.length > 0 && trimmedComment.length < 10) {
      toast.error("El comentario debe tener al menos 10 caracteres");
      return;
    }
    
    if (trimmedComment.length > 500) {
      toast.error("El comentario no puede exceder 500 caracteres");
      return;
    }
    
    onSubmit({ calificacion: rating, comentario: trimmedComment, reviewId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {reviewId ? "Editar Reseña" : "Escribir Reseña"}
          </DialogTitle>
          <DialogDescription>
            Comparte tu experiencia en {restaurantName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Calificación *</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating} de 5 estrellas
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comentario</Label>
            <Textarea
              id="comment"
              placeholder="Cuéntanos sobre tu experiencia... (mínimo 10 caracteres)"
              value={comment}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setComment(e.target.value);
                }
              }}
              rows={6}
              className="resize-none"
            />
            <div className="flex justify-between items-center text-xs">
              <span className={`${comment.trim().length > 0 && comment.trim().length < 10 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {comment.trim().length > 0 && comment.trim().length < 10 ? 'Mínimo 10 caracteres' : ''}
              </span>
              <span className={`${comment.length > 450 ? 'text-warning' : 'text-muted-foreground'}`}>
                {comment.length}/500
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              rating === 0 || 
              isLoading || 
              (comment.trim().length > 0 && comment.trim().length < 10) ||
              comment.length > 500
            }
          >
            {isLoading ? "Publicando..." : reviewId ? "Actualizar" : "Publicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
