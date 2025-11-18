"use client"

import {
  Home,
  Package,
  FileText,
  Globe,
  Volume2,
  Users,
  Store,
  Warehouse,
  Receipt,
  Settings,
  UserCheck,
  Calendar,
  ChevronUp,
  User2,
  MapPin,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes";

const storedUser = localStorage.getItem('imagiq_user');
const parsedUser = JSON.parse(storedUser || "")

const data = {
  user: {
    name: parsedUser.name,
    email: parsedUser.email,
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/inicio",
      icon: Home,
    },
    {
      title: "Productos",
      url: "/productos",
      icon: Package,
    },
    {
      title: "Órdenes",
      url: "/ordenes",
      icon: FileText,
    },
    {
      title: "Página Web",
      url: "/pagina-web",
      icon: Globe,
    },
    {
      title: "Marketing",
      url: "/marketing",
      icon: Volume2,
      items: [
        {
          title: "Banners",
          url: "/marketing/banners",
        },
        {
          title: "Campañas",
          url: "/marketing/campaigns",
        },
      ],
    },
    {
      title: "Clientes",
      url: "/clientes",
      icon: Users,
    },
    {
      title: "Punto Físico",
      url: "/punto-fisico",
      icon: Store,
    },
    {
      title: "Bodega",
      url: "/bodega",
      icon: Warehouse,
    },
    {
      title: "Zonas de Cobertura",
      url: "/zonas-cobertura",
      icon: MapPin,
    },
  ],
  navSecondary: [
    {
      title: "Facturación",
      url: "/facturacion",
      icon: Receipt,
    },
    {
      title: "Configuraciones",
      url: "/configuraciones",
      icon: Settings,
    },
    {
      title: "Usuarios",
      url: "/usuarios",
      icon: UserCheck,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }
  const {theme} = useTheme()
  console.log(theme)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          {/* <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="size-4" />
          </div> */}
          <Image
                src={ theme == 'light'?  "/frame_black.png" : "/frame_white.png"}
                alt="Q Logo"
                height={40}
                width={40}
                className="h-10 w-10 transition-all duration-300"
                priority
              />
            
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Bienvenido</span>
            <span className="truncate text-xs">{parsedUser.name}</span>
          </div>
          <ThemeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.items?.length ? false : undefined}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    {item.items?.length ? (
                      <>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronUp className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </>
                    ) : (
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link href={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <User2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{data.user.name}</span>
                    <span className="truncate text-xs">{data.user.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem>
                  <User2 />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings />
                  Configuraciones
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <Calendar />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}