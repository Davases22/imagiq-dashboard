"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UserStatsCards } from "@/components/users/user-stats-cards";
import { UsersDataTable } from "@/components/users/users-data-table";
import { UserFormModal } from "@/components/users/user-form-modal";
import { UserPermissionsModal } from "@/components/users/user-permissions-modal";
import { createUserColumns } from "@/components/users/user-columns";
import { mockUsers, mockUserActivity, mockUserStats, rolePermissions } from "@/lib/mock-data/users";
import { User, UserActivity, UserRole, Permission, UpdatePermissionsPayload } from "@/types/users";
import { userEndpoints, CreateUserRequest, BackendUser } from "@/lib/api";
import {
  Users,
  UserPlus,
  Activity,
  Shield,
  Clock,
  Download,
  FileText,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>(mockUserActivity);
  const [stats, setStats] = useState(mockUserStats);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [usersToDelete, setUsersToDelete] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | undefined>();

  // Función para convertir BackendUser a User
  const convertBackendUserToUser = (backendUser: BackendUser): User => {
    return {
      id: backendUser.id || backendUser.uuid || '',
      email: backendUser.email,
      name: `${backendUser.nombre} ${backendUser.apellido}`,
      rol: typeof backendUser.rol === 'number' ? backendUser.rol : parseInt(backendUser.rol) || 4,
      permissions: [],
      status: 'active',
      department: '',
      phoneNumber: backendUser.telefono || '',
      location: '',
      timezone: 'America/Bogota',
      twoFactorEnabled: false,
      createdAt: backendUser.created_at ? new Date(backendUser.created_at) : new Date(),
      updatedAt: backendUser.updated_at ? new Date(backendUser.updated_at) : new Date(),
      createdBy: 'system',
      loginAttempts: 0,
    };
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await userEndpoints.getAll();
        console.log("Respuesta de usuarios:", response);

        if (response.success && response.data) {
          // La API devuelve directamente un array
          const backendUsers = Array.isArray(response.data) ? response.data : [];
          const convertedUsers = backendUsers.map(convertBackendUserToUser);
          setUsers(convertedUsers);

          // Actualizar stats
          setStats(prev => ({
            ...prev,
            totalUsers: convertedUsers.length,
          }));
        } else {
          console.error("Error al cargar usuarios:", response.message);
          toast.error("Error al cargar usuarios");
          // Usar datos mock si falla
          setUsers(mockUsers);
        }
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        toast.error("Error al cargar usuarios");
        // Usar datos mock si falla
        setUsers(mockUsers);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleCreateUser = async (userData: any) => {
    try {
      const requestData: CreateUserRequest = {
        nombre: userData.name,
        apellido: userData.apellido,
        email: userData.email,
        contrasena: userData.contrasena,
        fecha_nacimiento: userData.fecha_nacimiento || undefined,
        numero_documento: userData.numero_documento || undefined,
        tipo_documento: userData.tipo_documento || "CC",
        telefono: userData.telefono || undefined,
        rol: userData.rol,
      };

      console.log("Datos enviados a la API:", requestData);

      const response = await userEndpoints.create(requestData);

      if (response.success && response.data.user) {
        const newUser: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: `${response.data.user.nombre} ${response.data.user.apellido}`,
          rol: typeof response.data.user.rol === 'number' ? response.data.user.rol : parseInt(response.data.user.rol) || userData.rol || 4,
          permissions: userData.customPermissions || [],
          status: userData.status || 'active',
          department: userData.department || '',
          phoneNumber: userData.phoneNumber || '',
          location: userData.location || '',
          timezone: userData.timezone || 'America/Bogota',
          twoFactorEnabled: userData.twoFactorEnabled || false,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'current-user',
          loginAttempts: 0,
        };

        setUsers([...users, newUser]);
        toast.success(response.message || "Usuario creado exitosamente");

        // Recargar la lista de usuarios desde la API
        const updatedResponse = await userEndpoints.getAll();
        if (updatedResponse.success && updatedResponse.data) {
          const backendUsers = Array.isArray(updatedResponse.data) ? updatedResponse.data : [];
          const convertedUsers = backendUsers.map(convertBackendUserToUser);
          setUsers(convertedUsers);
        }

        // Update stats
        setStats(prev => ({
          ...prev,
          totalUsers: prev.totalUsers + 1,
          newUsersThisMonth: prev.newUsersThisMonth + 1,
          usersByRole: {
            ...prev.usersByRole,
            [userData.rol]: ((prev.usersByRole as Record<number, number>)[userData.rol] || 0) + 1
          }
        }));
      } else {
        toast.error(response.message || "Error al crear usuario");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Error al crear usuario");
    }
  };

  const handleEditUser = (userData: any) => {
    if (!editingUser) return;

    const updatedUser: User = {
      ...editingUser,
      name: userData.name,
      rol: userData.rol || editingUser.rol,
      permissions: userData.customPermissions || [],
      status: userData.status,
      department: userData.department || '',
      phoneNumber: userData.phoneNumber || '',
      location: userData.location || '',
      timezone: userData.timezone || 'America/Bogota',
      twoFactorEnabled: userData.twoFactorEnabled || false,
      updatedAt: new Date(),
    };

    setUsers(users.map(user => user.id === editingUser.id ? updatedUser : user));
    toast.success("Usuario actualizado exitosamente");
    setEditingUser(undefined);
  };

  const handleDeleteUsers = (userIds: string[]) => {
    setUsersToDelete(userIds);
    setIsDeleteAlertOpen(true);
  };

  // const confirmDeleteUsers = () => {
  //   const deletedUsers = users.filter(user => usersToDelete.includes(user.id));
  //   setUsers(users.filter(user => !usersToDelete.includes(user.id)));

  //   toast.success(`${usersToDelete.length} usuario(s) eliminado(s)`);

  //   // Update stats
  //   setStats(prev => {
  //     const newUsersByRole = { ...prev.usersByRole };
  //     deletedUsers.forEach(user => {
  //       newUsersByRole[user.role] = Math.max(0, newUsersByRole[user.role] - 1);
  //     });

  //     return {
  //       ...prev,
  //       totalUsers: prev.totalUsers - usersToDelete.length,
  //       usersByRole: newUsersByRole
  //     };
  //   });

  //   setUsersToDelete([]);
  //   setIsDeleteAlertOpen(false);
  // };

  const handleOpenPermissionsModal = (user: User) => {
    setSelectedUserForPermissions(user);
    setIsPermissionsModalOpen(true);
  };

  const handleSavePermissions = async (payload: UpdatePermissionsPayload) => {
    try {
      const response = await userEndpoints.updatePermissions(payload);

      if (response.success) {
        toast.success("Permisos actualizados exitosamente");
        // Opcional: Actualizar el usuario en el estado local
        setUsers(users.map(u =>
          u.id === payload.userId
            ? { ...u, permissions: [] } // Aquí podrías mapear los permisos si es necesario
            : u
        ));
      } else {
        toast.error(response.message || "Error al actualizar permisos");
      }
    } catch (error) {
      console.error("Error al actualizar permisos:", error);
      toast.error("Error al actualizar permisos");
    }
  };

  const handleExportUsers = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Nombre,Email,Rol,Estado,Departamento,Ubicación,Último acceso\n" +
      users.map(user =>
        `"${user.name}","${user.email}","${user.rol}","${user.status}","${user.department || ''}","${user.location || ''}","${user.lastLogin ? user.lastLogin.toISOString() : 'Nunca'}"`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Archivo CSV descargado");
  };

  const getActionTypeLabel = (action: string) => {
    const labels: Record<string, string> = {
      'user.login': 'Inicio de sesión',
      'user.logout': 'Cierre de sesión',
      'user.create': 'Usuario creado',
      'user.update': 'Usuario actualizado',
      'user.delete': 'Usuario eliminado',
      'campaign.create': 'Campaña creada',
      'campaign.update': 'Campaña actualizada',
      'campaign.delete': 'Campaña eliminada',
      'product.create': 'Producto creado',
      'product.update': 'Producto actualizado',
      'product.delete': 'Producto eliminado',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('.create')) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    if (action.includes('.update')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    if (action.includes('.delete')) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    if (action.includes('.login')) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
    return 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300';
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportUsers}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Crear Usuario
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <UserStatsCards stats={stats} />

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-3">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Actividad Reciente
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Matriz de Permisos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <UsersDataTable
                columns={createUserColumns(handleOpenPermissionsModal)}
                data={users}
                onCreateUser={() => setIsCreateModalOpen(true)}
                onDeleteUsers={handleDeleteUsers}
                onExportUsers={handleExportUsers}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Actividad Reciente del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userActivity.map((activity) => {
                  const user = users.find(u => u.id === activity.userId);
                  return (
                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getActionColor(activity.action)}>
                              {getActionTypeLabel(activity.action)}
                            </Badge>
                            <span className="text-sm font-medium">
                              {user?.name || 'Usuario desconocido'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {user?.email}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              IP: {activity.ipAddress}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: es })}
                          </span>
                        </div>
                        <Badge variant={activity.success ? "default" : "destructive"}>
                          {activity.success ? "Exitoso" : "Fallido"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Matriz de Permisos por Rol
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(rolePermissions).map(([role, permissions]) => (
                  <div key={role} className="space-y-2">
                    <h3 className="font-medium flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {role === 'super_admin' ? 'Super Admin' :
                         role === 'admin' ? 'Administrador' :
                         role === 'manager' ? 'Manager' :
                         role === 'editor' ? 'Editor' : 'Visualizador'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ({permissions.length} permisos)
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {permissions.map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit User Modal */}
      <UserFormModal
        open={isCreateModalOpen || !!editingUser}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingUser(undefined);
        }}
        user={editingUser}
        onSave={editingUser ? handleEditUser : handleCreateUser}
      />

      {/* User Permissions Modal */}
      {selectedUserForPermissions && (
        <UserPermissionsModal
          open={isPermissionsModalOpen}
          onClose={() => {
            setIsPermissionsModalOpen(false);
            setSelectedUserForPermissions(undefined);
          }}
          userId={selectedUserForPermissions.id}
          userName={selectedUserForPermissions.name}
          currentPermissions={[]}
          onSave={handleSavePermissions}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar {usersToDelete.length} usuario(s)?
              Esta acción no se puede deshacer y se perderá toda la información asociada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              //onClick={confirmDeleteUsers}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}