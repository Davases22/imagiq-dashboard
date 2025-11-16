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

const getRoleColor = (role: User['role']) => {
  const colors = {
    super_admin: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    manager: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    editor: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    viewer: 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300'
  };
  return colors[role] || colors.viewer;
};

const getStatusColor = (status: User['status']) => {
  const colors = {
    active: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    inactive: 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300',
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    suspended: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
  };
  return colors[status];
};

const getRoleLabel = (role: User['role']) => {
  const labels = {
    super_admin: 'Super Admin',
    admin: 'Administrador',
    manager: 'Manager',
    editor: 'Editor',
    viewer: 'Visualizador'
  };
  return labels[role];
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
    accessorKey: "role",
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
      const role = row.getValue("role") as User['role'];
      return (
        <Badge variant="outline" className={getRoleColor(role)}>
          <Shield className="mr-1 h-3 w-3" />
          {getRoleLabel(role)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Estado
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as User['status'];
      return (
        <Badge variant="outline" className={getStatusColor(status)}>
          {getStatusLabel(status)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "department",
    header: "Departamento",
    cell: ({ row }) => {
      const department = row.getValue("department") as string;
      return department ? (
        <span className="text-sm">{department}</span>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "location",
    header: "Ubicación",
    cell: ({ row }) => {
      const location = row.getValue("location") as string;
      return location ? (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{location}</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "lastLogin",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Último acceso
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const lastLogin = row.getValue("lastLogin") as Date | undefined;
      return lastLogin ? (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {formatDistanceToNow(lastLogin, { addSuffix: true, locale: es })}
          </span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">Nunca</span>
      );
    },
  },
  {
    accessorKey: "twoFactorEnabled",
    header: "2FA",
    cell: ({ row }) => {
      const twoFactorEnabled = row.getValue("twoFactorEnabled") as boolean;
      return (
        <Badge
          variant="outline"
          className={twoFactorEnabled
            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
          }
        >
          {twoFactorEnabled ? (
            <>
              <UserCheck className="mr-1 h-3 w-3" />
              Activo
            </>
          ) : (
            <>
              <UserX className="mr-1 h-3 w-3" />
              Inactivo
            </>
          )}
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