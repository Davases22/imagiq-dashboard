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

const getRoleColor = (rol: User['rol']) => {
  // Mapeo de roles a colores: 1 = Admin, 2 = Usuario, 3 = Invitado, 4 = Super Admin
  const colorMap: Record<number, string> = {
    1: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300', // Admin
    2: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', // Usuario
    3: 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300', // Invitado
    4: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' // Super Admin
  };
  return colorMap[rol] || 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300';
};


const getRoleLabel = (rol: User['rol']) => {
  // Mapeo de roles: 1 = Admin, 2 = Usuario, 3 = Invitado, 4 = Super Admin
  const roleMap: Record<number, string> = {
    1: 'Admin',
    2: 'Usuario',
    3: 'Invitado',
    4: 'Super Admin'
  };
  return roleMap[rol] || 'Usuario';
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const createUserColumns = (onEditUser?: (user: User) => void): ColumnDef<User>[] => [
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
            <DropdownMenuItem onClick={() => onEditUser?.(user)}>
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