"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, UpdatePermissionsPayload } from "@/types/users";
import { userEndpoints, CreateUserRequest, BackendUser, UserSummaryResponse } from "@/lib/api";
import { mockUsers, mockUserStats } from "@/lib/mock-data/users";

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

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState(mockUserStats);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuarios y summary
  const loadUsers = async () => {
    try {
      const [usersResponse, summaryResponse] = await Promise.all([
        userEndpoints.getAll(),
        userEndpoints.getSummary()
      ]);

      if (usersResponse.success && usersResponse.data) {
        const backendUsers = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        const convertedUsers = backendUsers.map(convertBackendUserToUser);
        setUsers(convertedUsers);
      } else {
        toast.error("Error al cargar usuarios");
        setUsers(mockUsers);
      }

      // Actualizar stats con datos del summary
      if (summaryResponse.success && summaryResponse.data) {
        const summary = summaryResponse.data;
        setStats({
          totalUsers: summary.total,
          activeUsers: summary.total, // Por ahora usamos total ya que no hay campo de activos
          pendingUsers: 0,
          suspendedUsers: 0,
          newUsersThisMonth: 0,
          adminUsers: summary.rol_1,
          regularUsers: summary.rol_2,
          guestUsers: summary.rol_3,
          superAdminUsers: summary.rol_4,
        });
      }
    } catch (error) {
      toast.error("Error al cargar usuarios");
      setUsers(mockUsers);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Crear usuario
  const createUser = async (userData: any): Promise<{ success: boolean; userId?: string }> => {
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

      const response = await userEndpoints.create(requestData);

      if (response.success) {
        toast.success(response.message || "Usuario creado exitosamente");
        const userId = response.data?.user?.id;

        // Recargar lista
        const updatedResponse = await userEndpoints.getAll();
        if (updatedResponse.success && updatedResponse.data) {
          const backendUsers = Array.isArray(updatedResponse.data) ? updatedResponse.data : [];
          const convertedUsers = backendUsers.map(convertBackendUserToUser);
          setUsers(convertedUsers);
          setStats(prev => ({
            ...prev,
            totalUsers: convertedUsers.length,
          }));
        }

        return { success: true, userId };
      } else {
        toast.error(response.message || "Error al crear usuario");
        return { success: false };
      }
    } catch (error) {
      toast.error("Error al crear usuario");
      return { success: false };
    }
  };

  // Editar usuario
  const editUser = async (userId: string, userData: any): Promise<{ success: boolean; userId?: string }> => {
    try {
      const requestData = {
        nombre: userData.name,
        apellido: userData.apellido,
        fecha_nacimiento: userData.fecha_nacimiento || undefined,
        numero_documento: userData.numero_documento || undefined,
        tipo_documento: userData.tipo_documento || "CC",
        telefono: userData.telefono || undefined,
        rol: userData.rol,
      };

      const response = await userEndpoints.update(userId, requestData);

      if (response.success) {
        toast.success(response.message || "Información básica actualizada exitosamente");

        const currentUser = users.find(u => u.id === userId);
        if (currentUser) {
          const updatedUser: User = {
            ...currentUser,
            name: `${userData.name} ${userData.apellido}`,
            rol: typeof userData.rol === 'number' ? userData.rol : parseInt(userData.rol) || currentUser.rol,
            phoneNumber: userData.telefono || '',
            updatedAt: new Date(),
          };

          setUsers(users.map(user => user.id === userId ? updatedUser : user));
        }

        return { success: true, userId };
      } else {
        toast.error(response.message || "Error al actualizar usuario");
        return { success: false };
      }
    } catch (error) {
      toast.error("Error al actualizar usuario");
      return { success: false };
    }
  };

  // Actualizar permisos
  const updatePermissions = async (payload: UpdatePermissionsPayload): Promise<void> => {
    try {
      const response = await userEndpoints.updatePermissions(payload);

      if (response.success) {
        toast.success("Permisos actualizados exitosamente");
        setUsers(users.map(u =>
          u.id === payload.userId
            ? { ...u, permissions: [] }
            : u
        ));
      } else {
        toast.error(response.message || "Error al actualizar permisos");
      }
    } catch (error) {
      toast.error("Error al actualizar permisos");
    }
  };

  // Exportar usuarios
  const exportUsers = () => {
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

  return {
    users,
    stats,
    isLoading,
    createUser,
    editUser,
    updatePermissions,
    exportUsers,
    setUsers,
  };
}
