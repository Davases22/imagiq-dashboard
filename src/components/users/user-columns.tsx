"use client";

import { ColumnDef } from "@tanstack/react-table";
import { User } from "@/types/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  ArrowUpDown,
  UserCheck,
  UserX,
  Shield,
  Edit,
  Trash2,
  Eye,
  Clock,
  MapPin
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const getRoleColor = (rol: User['rol'] | number) => {
  // Mapeo de números a colores
  if (typeof rol === 'number') {
    const colorMap: Record<number, string> = {
      1: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', // Super Admin
      2: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300', // Admin
      3: 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300', // Visualizador
      4: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' // Usuario
    };
    return colorMap[rol] || 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300';
  }

  // Mapeo de strings a colores
  const colors = {
    super_admin: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    manager: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    editor: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    viewer: 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300'
  };
  return colors[rol] || colors.viewer;
};


const getRoleLabel = (rol: User['rol'] | number) => {
   console.log(rol)
  // Mapeo de números a roles
  if (typeof rol === 'number') {
   
    const roleMap: Record<number, string> = {
      1: 'Super Admin',
      2: 'Administrador',
      3: 'Visualizador',
      4: 'Usuario'
    };
    return roleMap[rol] || 'Usuario';
  }

  // Mapeo de strings a roles
  const labels = {
    super_admin: 'Super Admin',
    admin: 'Administrador',
    manager: 'Manager',
    editor: 'Editor',
    viewer: 'Visualizador'
  };
  return labels[rol];
};

const getStatusLabel = (status: User['status']) => {
  const labels = {
    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente',
    suspended: 'Suspendido'
  };
  return labels[status];
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const createUserColumns = (onEditPermissions?: (user: User) => void): ColumnDef<User>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todo"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Usuario
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "rol",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Rol
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const rol = row.getValue("rol") as User['rol'];
      return (
        <Badge variant="outline" className={getRoleColor(rol)}>
          <Shield className="mr-1 h-3 w-3" />
          {getRoleLabel(rol)}
        </Badge>
      );
    },
  },

  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.email)}
            >
              Copiar email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              Ver perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditPermissions?.(user)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar usuario
            </DropdownMenuItem>
            {user.status === 'active' ? (
              <DropdownMenuItem className="text-orange-600">
                <UserX className="mr-2 h-4 w-4" />
                Suspender usuario
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="text-green-600">
                <UserCheck className="mr-2 h-4 w-4" />
                Activar usuario
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar usuario
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Exportación por defecto para compatibilidad
export const userColumns = createUserColumns();