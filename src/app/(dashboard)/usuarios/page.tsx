"use client";

import { useState } from "react";
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
import { UserStatsCards } from "@/components/users/user-stats-cards";
import { UsersDataTable } from "@/components/users/users-data-table";
import { UserFormModal } from "@/components/users/user-form-modal";
import { createUserColumns } from "@/components/users/user-columns";
import { mockUserActivity, rolePermissions } from "@/lib/mock-data/users";
import { User, UserActivity } from "@/types/users";
import { useUsers } from "@/hooks/use-users";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  Users,
  UserPlus,
  Activity,
  Shield,
  Clock,
  Download,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function UsuariosPage() {
  const {
    users,
    stats,
    isLoading,
    createUser,
    editUser,
    updatePermissions,
    exportUsers,
  } = useUsers();

  const [userActivity] = useState<UserActivity[]>(mockUserActivity);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [usersToDelete, setUsersToDelete] = useState<string[]>([]);

  const handleCreateUser = async (userData: any) => {
    return createUser(userData);
  };

  const handleEditUser = async (userData: any) => {
    if (!editingUser) return { success: false };
    return editUser(editingUser.id, userData);
  };

  const handleDeleteUsers = (userIds: string[]) => {
    setUsersToDelete(userIds);
    setIsDeleteAlertOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
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
          <Button variant="outline" onClick={exportUsers}>
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
              {isLoading ? (
                <TableSkeleton columns={6} rows={5} />
              ) : (
                <UsersDataTable
                  columns={createUserColumns(handleOpenEditModal)}
                  data={users}
                  onCreateUser={() => setIsCreateModalOpen(true)}
                  onDeleteUsers={handleDeleteUsers}
                  onExportUsers={exportUsers}
                />
              )}
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
                {Object.entries(rolePermissions).map(([roleId, permissions]) => {
                  const roleNames: Record<string, string> = {
                    '1': 'Admin',
                    '2': 'Usuario',
                    '3': 'Invitado',
                    '4': 'Super Admin'
                  };

                  return (
                    <div key={roleId} className="space-y-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {roleNames[roleId] || `Rol ${roleId}`}
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
                  );
                })}
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
        onSavePermissions={updatePermissions}
      />

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
            <AlertDialogAction className="bg-red-600 hover:bg-red-700">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
