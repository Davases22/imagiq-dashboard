"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  Search,
  Download,
  MoreHorizontal,
  Eye,
  Mail,
  Tag,
  Trash2,
  UserPlus,
  Phone,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  Calendar,
  Shield,
} from "lucide-react"

interface DatabaseUser {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  rol: number
  activo: boolean
  bloqueado: boolean
  tipo_documento?: string
  numero_documento?: string
  codigo_pais?: string
  fecha_nacimiento?: string
  fecha_creacion?: string
  ultimo_login?: string
  telefono_verificado: boolean
  email_verificado: boolean
}

export default function ClientesListaPage() {
  const router = useRouter()
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [rolFilter, setRolFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("recent")
  const [users, setUsers] = useState<DatabaseUser[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<DatabaseUser | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const pageSize = 20

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch users from database
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const offset = (currentPage - 1) * pageSize
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
      })
      if (debouncedSearch) {
        params.append('search', debouncedSearch)
      }
      if (rolFilter !== 'all') {
        params.append('rol', rolFilter)
      }
      if (sortBy) {
        params.append('sortBy', sortBy)
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/users/list?${params}`

      const response = await fetch(url, {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setTotalUsers(data.total || 0)
      } else {
        console.error('Error response:', await response.text())
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, rolFilter, sortBy])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const totalPages = Math.ceil(totalUsers / pageSize)

  const getRolLabel = (rol: number) => {
    switch (rol) {
      case 2:
        return { label: "Registrado", color: "bg-green-500" }
      case 3:
        return { label: "Invitado", color: "bg-gray-500" }
      default:
        return { label: "Desconocido", color: "bg-gray-300" }
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
  }

  const formatDateShort = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateString))
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(users.map((u) => u.id))
    } else {
      setSelectedCustomers([])
    }
  }

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, customerId])
    } else {
      setSelectedCustomers(selectedCustomers.filter((id) => id !== customerId))
    }
  }

  // Count users by rol
  const registeredCount = users.filter(u => u.rol === 2).length
  const guestCount = users.filter(u => u.rol === 3).length

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/clientes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Base de Datos de Clientes
            </h1>
            <p className="text-sm text-muted-foreground">
              {loading ? "Cargando..." : `${totalUsers} clientes encontrados`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Agregar Cliente
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              Registrados (Rol 2)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{registeredCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserX className="h-4 w-4 text-gray-500" />
              Invitados (Rol 3)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{guestCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={rolFilter} onValueChange={(value) => { setRolFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="2">Registrados</SelectItem>
                  <SelectItem value="3">Invitados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value) => { setSortBy(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Más reciente</SelectItem>
                  <SelectItem value="oldest">Más antiguo</SelectItem>
                  <SelectItem value="last_login">Último login</SelectItem>
                  <SelectItem value="name">Nombre A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedCustomers.length > 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {selectedCustomers.length} cliente(s) seleccionado(s)
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Email
                </Button>
                <Button variant="outline" size="sm">
                  <Tag className="mr-2 h-4 w-4" />
                  Agregar Tag
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={users.length > 0 && selectedCustomers.length === users.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Verificación</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Cargando usuarios...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const rolConfig = getRolLabel(user.rol)
                    const fullName = [user.nombre, user.apellido].filter(Boolean).join(" ") || "Sin nombre"
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCustomers.includes(user.id)}
                            onCheckedChange={(checked) =>
                              handleSelectCustomer(user.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{fullName}</span>
                            <span className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {user.email || "N/A"}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {user.codigo_pais ? `+${user.codigo_pais} ` : ""}{user.telefono || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {user.tipo_documento && user.numero_documento
                              ? `${user.tipo_documento}: ${user.numero_documento}`
                              : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${rolConfig.color}`} />
                            <span className="text-sm">{rolConfig.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={user.activo ? "default" : "secondary"} className="w-fit text-xs">
                              {user.activo ? "Activo" : "Inactivo"}
                            </Badge>
                            {user.bloqueado && (
                              <Badge variant="destructive" className="w-fit text-xs">
                                Bloqueado
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-xs">
                              {user.email_verificado ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                              Email
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              {user.telefono_verificado ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                              Teléfono
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDateShort(user.fecha_creacion)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {user.ultimo_login ? formatDate(user.ultimo_login) : "Nunca"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setSelectedUser(user); setShowProfileModal(true); }}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" />
                                Enviar email
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Shield className="mr-2 h-4 w-4" />
                                {user.bloqueado ? "Desbloquear" : "Bloquear"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalUsers)} de {totalUsers}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Perfil de Usuario */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Perfil del Cliente</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Info Principal */}
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  {selectedUser.nombre?.[0]?.toUpperCase() || selectedUser.email?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {[selectedUser.nombre, selectedUser.apellido].filter(Boolean).join(" ") || "Sin nombre"}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={selectedUser.rol === 2 ? "default" : "secondary"}>
                      {selectedUser.rol === 2 ? "Registrado" : "Invitado"}
                    </Badge>
                    <Badge variant={selectedUser.activo ? "default" : "destructive"}>
                      {selectedUser.activo ? "Activo" : "Inactivo"}
                    </Badge>
                    {selectedUser.bloqueado && (
                      <Badge variant="destructive">Bloqueado</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Datos de Contacto */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedUser.email || "N/A"}</span>
                    {selectedUser.email_verificado ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Teléfono</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedUser.codigo_pais ? `+${selectedUser.codigo_pais} ` : ""}
                      {selectedUser.telefono || "N/A"}
                    </span>
                    {selectedUser.telefono_verificado ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Documento */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Tipo de Documento</p>
                  <p className="text-sm">{selectedUser.tipo_documento || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Número de Documento</p>
                  <p className="text-sm">{selectedUser.numero_documento || "N/A"}</p>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Fecha de Registro</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(selectedUser.fecha_creacion)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Último Login</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedUser.ultimo_login ? formatDate(selectedUser.ultimo_login) : "Nunca"}</span>
                  </div>
                </div>
              </div>

              {/* Fecha de Nacimiento */}
              {selectedUser.fecha_nacimiento && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Fecha de Nacimiento</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDateShort(selectedUser.fecha_nacimiento)}</span>
                  </div>
                </div>
              )}

              {/* ID del Usuario */}
              <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase font-medium">ID del Usuario</p>
                <p className="text-xs font-mono text-muted-foreground">{selectedUser.id}</p>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1">
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Email
                </Button>
                <Button variant="outline" className="flex-1">
                  <Shield className="mr-2 h-4 w-4" />
                  {selectedUser.bloqueado ? "Desbloquear" : "Bloquear"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
