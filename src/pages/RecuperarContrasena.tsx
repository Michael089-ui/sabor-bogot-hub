import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Info } from "lucide-react";

const recoverySchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});

type RecoveryFormData = z.infer<typeof recoverySchema>;

const RecuperarContrasena = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecoveryFormData>({
    resolver: zodResolver(recoverySchema),
  });

  const onSubmit = async (data: RecoveryFormData) => {
    setIsLoading(true);
    const result = await resetPassword(data.email);
    setIsLoading(false);

    if (!result.error) {
      setEmailSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">S</span>
          </div>
          <span className="font-bold text-lg text-foreground">Sabor Capital</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">Iniciar sesión</Link>
          </Button>
          <Button variant="default" asChild>
            <Link to="/registro">Crear cuenta</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Hero Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Recuperar contraseña
            </h1>
          </div>

          {/* Recovery Card */}
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Restablecer contraseña</CardTitle>
              <CardDescription>
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailSent ? (
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Se ha enviado un correo de recuperación. Por favor revisa tu bandeja de entrada y sigue las instrucciones.
                    </AlertDescription>
                  </Alert>
                  <Button className="w-full" asChild>
                    <Link to="/login">Volver al inicio de sesión</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@correo.com"
                        {...register("email")}
                        className="w-full"
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>

                    <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
                      {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                    </Button>
                  </form>

                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>¿Iniciaste sesión con Google?</strong>
                      <br />
                      Si creaste tu cuenta con Google, no necesitas restablecer tu contraseña. 
                      Simplemente <Link to="/login" className="text-primary hover:underline">inicia sesión con Google</Link>.
                    </AlertDescription>
                  </Alert>

                  <div className="text-center text-sm text-muted-foreground mt-4">
                    <Link to="/login" className="text-primary hover:underline font-medium">
                      Volver al inicio de sesión
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default RecuperarContrasena;
