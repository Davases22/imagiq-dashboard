"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserStats } from "@/types/users";
import {
  Users,
  Shield,
  Crown,
  User,
  UserCheck
} from "lucide-react";

interface UserStatsCardsProps {
  stats: UserStats;
}

export function UserStatsCards({ stats }: UserStatsCardsProps) {
  const getPercentage = (value: number | undefined) => {
    if (!value || !stats.totalUsers) return 0;
    return ((value / stats.totalUsers) * 100).toFixed(1);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* Total Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            Usuarios registrados
          </p>
        </CardContent>
      </Card>

      {/* Super Admins - rol_4 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
          <Crown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.superAdminUsers ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {getPercentage(stats.superAdminUsers)}%
          </p>
        </CardContent>
      </Card>

      {/* Admins - rol_1 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Administradores</CardTitle>
          <Shield className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.adminUsers ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {getPercentage(stats.adminUsers)}%
          </p>
        </CardContent>
      </Card>

      {/* Users - rol_2 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
          <UserCheck className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.regularUsers ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {getPercentage(stats.regularUsers)}%
          </p>
        </CardContent>
      </Card>

      {/* Guests - rol_3 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Invitados</CardTitle>
          <User className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {stats.guestUsers ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {getPercentage(stats.guestUsers)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}