import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Bell,
  Lock,
  User,
  Info,
  LogOut,
  Trash2,
  Search,
  MapPin,
  History,
  Download,
  AlertTriangle,
  Eye,
  Key,
} from 'lucide-react';

const Configuracion = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();

  const [userEmail, setUserEmail] = useState('');
  const [userCreatedAt, setUserCreatedAt] = useState('');
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        const { data } = await supabase
          .from('usuario')
          .select('email, fecha_registro')
          .eq('id', user.id)
          .single();

        if (data) {
          setUserEmail(data.email || user.email || '');
          setUserCreatedAt(data.fecha_registro || '');
        }
      };
      fetchUserData();
    }
  }, [user]);

  const handleClearHistory = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { error: searchError } = await supabase
        .from('historial_busqueda')
        .delete()
        .eq('id_usuario', user.id);

      if (searchError) throw searchError;

      toast({
        title: 'Historial limpiado',
        description: 'Tu historial de búsquedas ha sido eliminado correctamente.',
      });
      setShowClearHistoryDialog(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo limpiar el historial. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña ha sido cambiada correctamente.',
      });
      setShowChangePasswordDialog(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar la contraseña. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'ELIMINAR') {
      toast({
        title: 'Error',
        description: 'Debes escribir "ELIMINAR" para confirmar.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;
    setIsLoading(true);

    try {
      const { error } = await supabase.from('usuario').delete().eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Cuenta eliminada',
        description: 'Tu cuenta ha sido eliminada permanentemente.',
      });

      await signOut();
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la cuenta. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">Personaliza tu experiencia en Sabor Capital</p>
        </div>
      </div>

      {/* Apariencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Apariencia
          </CardTitle>
          <CardDescription>Personaliza el tema de la aplicación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Tema</Label>
            <RadioGroup value={theme} onValueChange={setTheme} className="flex flex-col space-y-2">
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Sun className="h-4 w-4" />
                  Claro
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Moon className="h-4 w-4" />
                  Oscuro
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Monitor className="h-4 w-4" />
                  Sistema
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Búsqueda y Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Búsqueda y Resultados
          </CardTitle>
          <CardDescription>Configura cómo se muestran los resultados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-prices" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Mostrar precios
              </Label>
              <p className="text-sm text-muted-foreground">
                Muestra información de precios en los resultados
              </p>
            </div>
            <Switch
              id="show-prices"
              checked={settings.showPrices}
              onCheckedChange={(checked) => updateSettings({ showPrices: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="search-radius">Radio de búsqueda predeterminado</Label>
            <Select
              value={settings.searchRadius.toString()}
              onValueChange={(value) => updateSettings({ searchRadius: parseInt(value) })}
            >
              <SelectTrigger id="search-radius">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="500">500 metros</SelectItem>
                <SelectItem value="1000">1 kilómetro</SelectItem>
                <SelectItem value="2000">2 kilómetros</SelectItem>
                <SelectItem value="5000">5 kilómetros</SelectItem>
                <SelectItem value="10000">10 kilómetros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Unidades de distancia</Label>
            <RadioGroup
              value={settings.distanceUnit}
              onValueChange={(value: 'km' | 'mi') => updateSettings({ distanceUnit: value })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="km" id="km" />
                <Label htmlFor="km" className="cursor-pointer">Kilómetros</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mi" id="mi" />
                <Label htmlFor="mi" className="cursor-pointer">Millas</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>Gestiona tus preferencias de notificaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Notificaciones push</Label>
              <p className="text-sm text-muted-foreground">
                Recibe alertas sobre nuevos restaurantes y ofertas
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => updateSettings({ pushNotifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Notificaciones por email</Label>
              <p className="text-sm text-muted-foreground">
                Recibe resumen semanal de tus lugares favoritos
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => updateSettings({ emailNotifications: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacidad y Datos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Privacidad y Datos
          </CardTitle>
          <CardDescription>Controla tu información y privacidad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="share-location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Compartir ubicación automáticamente
              </Label>
              <p className="text-sm text-muted-foreground">
                Permite que la app use tu ubicación para mejorar resultados
              </p>
            </div>
            <Switch
              id="share-location"
              checked={settings.shareLocation}
              onCheckedChange={(checked) => updateSettings({ shareLocation: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="save-history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Guardar historial de búsquedas
              </Label>
              <p className="text-sm text-muted-foreground">
                Guarda tu historial para recomendaciones personalizadas
              </p>
            </div>
            <Switch
              id="save-history"
              checked={settings.saveHistory}
              onCheckedChange={(checked) => updateSettings({ saveHistory: checked })}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowClearHistoryDialog(true)}
              className="flex-1"
            >
              <History className="h-4 w-4 mr-2" />
              Limpiar historial
            </Button>
            <Button variant="outline" className="flex-1" disabled>
              <Download className="h-4 w-4 mr-2" />
              Descargar mis datos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cuenta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Cuenta
          </CardTitle>
          <CardDescription>Gestiona tu información de cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button variant="outline" onClick={() => navigate('/perfil')} className="w-full">
              <User className="h-4 w-4 mr-2" />
              Editar perfil
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowChangePasswordDialog(true)}
              className="w-full"
            >
              <Key className="h-4 w-4 mr-2" />
              Cambiar contraseña
            </Button>
          </div>

          <div className="pt-4 border-t border-border space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{userEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Miembro desde:</span>
              <span className="font-medium">
                {userCreatedAt ? new Date(userCreatedAt).toLocaleDateString('es-CO') : '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Información
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <span className="text-muted-foreground">Versión de la app: </span>
            <span className="font-medium">v1.0.0</span>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="link" className="justify-start p-0 h-auto text-primary" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                Términos y condiciones
              </a>
            </Button>
            <Button variant="link" className="justify-start p-0 h-auto text-primary" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                Política de privacidad
              </a>
            </Button>
            <Button variant="link" className="justify-start p-0 h-auto text-primary" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                Centro de ayuda
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Zona de Peligro */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zona de Peligro
          </CardTitle>
          <CardDescription>Acciones irreversibles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={handleLogout} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteAccountDialog(true)}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar cuenta
          </Button>
        </CardContent>
      </Card>

      {/* Dialog: Limpiar Historial */}
      <Dialog open={showClearHistoryDialog} onOpenChange={setShowClearHistoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará todo tu historial de búsquedas. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearHistoryDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleClearHistory} disabled={isLoading}>
              {isLoading ? 'Eliminando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Cambiar Contraseña */}
      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>Ingresa tu nueva contraseña</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Contraseña actual</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowChangePasswordDialog(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Eliminar Cuenta */}
      <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar cuenta permanentemente</DialogTitle>
            <DialogDescription>
              Esta acción es irreversible. Todos tus datos, favoritos, reseñas e historial serán
              eliminados permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                Escribe <strong>ELIMINAR</strong> para confirmar
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="ELIMINAR"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteAccountDialog(false);
                setDeleteConfirmation('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isLoading || deleteConfirmation !== 'ELIMINAR'}
            >
              {isLoading ? 'Eliminando...' : 'Eliminar cuenta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Configuracion;
