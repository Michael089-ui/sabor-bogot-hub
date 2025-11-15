import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogoSaborCapital } from "@/components/LogoSaborCapital";

export const PublicHeader = () => {
  return (
    <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <LogoSaborCapital linkTo="/" />
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild>
            <Link to="/registro">Crear cuenta</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};
