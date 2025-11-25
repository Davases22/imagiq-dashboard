import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCategories } from "@/features/categories/useCategories"

interface CategoryOption {
  id: string
  nombre: string
}

interface MenuOption {
  id: string
  nombre: string
  categoryId: string
}

interface SubmenuOption {
  id: string
  nombre: string
  menuId: string
}

interface SectionTypeSelectorsProps {
  type: "categoria" | "menu" | "submenu"
  categoryId?: string
  menuId?: string
  submenuId?: string
  onCategoryChange: (categoryId: string) => void
  onMenuChange: (menuId: string) => void
  onSubmenuChange: (submenuId: string) => void
}

export function SectionTypeSelectors({
  type,
  categoryId,
  menuId,
  submenuId,
  onCategoryChange,
  onMenuChange,
  onSubmenuChange,
}: SectionTypeSelectorsProps) {
  const { categories } = useCategories()
  const [categoriesOptions, setCategoriesOptions] = useState<CategoryOption[]>([])
  const [menusOptions, setMenusOptions] = useState<MenuOption[]>([])
  const [submenusOptions, setSubmenusOptions] = useState<SubmenuOption[]>([])

  // Extraer y aplanar datos
  useEffect(() => {
    if (!categories || categories.length === 0) return

    const cats: CategoryOption[] = []
    const menus: MenuOption[] = []
    const submenus: SubmenuOption[] = []

    categories.forEach((cat) => {
      cats.push({
        id: cat.id,
        nombre: cat.nombreVisible || cat.name,
      })

      if (cat.menus && cat.menus.length > 0) {
        cat.menus.forEach((menu) => {
          menus.push({
            id: menu.id,
            nombre: menu.nombreVisible || menu.name,
            categoryId: cat.id,
          })

          if (menu.submenus && menu.submenus.length > 0) {
            menu.submenus.forEach((submenu) => {
              submenus.push({
                id: submenu.id,
                nombre: submenu.nombreVisible || submenu.name,
                menuId: menu.id,
              })
            })
          }
        })
      }
    })

    setCategoriesOptions(cats)
    setMenusOptions(menus)
    setSubmenusOptions(submenus)
  }, [categories])

  // Filtrar menús por categoría
  const availableMenus = categoryId
    ? menusOptions.filter((m) => m.categoryId === categoryId)
    : []

  // Filtrar submenús por menú
  const availableSubmenus = menuId
    ? submenusOptions.filter((s) => s.menuId === menuId)
    : []

  // Selector para tipo "categoria"
  if (type === "categoria") {
    return (
      <div className="space-y-2">
        <Label htmlFor="categorySelect">Categoría</Label>
        <Select value={categoryId || ""} onValueChange={onCategoryChange}>
          <SelectTrigger id="categorySelect">
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categoriesOptions.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  // Selectores para tipo "menu"
  if (type === "menu") {
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="categoryForMenu">Categoría</Label>
          <Select value={categoryId || ""} onValueChange={onCategoryChange}>
            <SelectTrigger id="categoryForMenu">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categoriesOptions.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {categoryId && (
          <div className="space-y-2">
            <Label htmlFor="menuSelect">Menú</Label>
            <Select value={menuId || ""} onValueChange={onMenuChange}>
              <SelectTrigger id="menuSelect">
                <SelectValue placeholder="Selecciona un menú" />
              </SelectTrigger>
              <SelectContent>
                {availableMenus.map((menu) => (
                  <SelectItem key={menu.id} value={menu.id}>
                    {menu.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </>
    )
  }

  // Selectores para tipo "submenu"
  if (type === "submenu") {
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="categoryForSubmenu">Categoría</Label>
          <Select value={categoryId || ""} onValueChange={onCategoryChange}>
            <SelectTrigger id="categoryForSubmenu">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categoriesOptions.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {categoryId && (
          <div className="space-y-2">
            <Label htmlFor="menuForSubmenu">Menú</Label>
            <Select value={menuId || ""} onValueChange={onMenuChange}>
              <SelectTrigger id="menuForSubmenu">
                <SelectValue placeholder="Selecciona un menú" />
              </SelectTrigger>
              <SelectContent>
                {availableMenus.map((menu) => (
                  <SelectItem key={menu.id} value={menu.id}>
                    {menu.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {menuId && (
          <div className="space-y-2">
            <Label htmlFor="submenuSelect">Submenú</Label>
            <Select value={submenuId || ""} onValueChange={onSubmenuChange}>
              <SelectTrigger id="submenuSelect">
                <SelectValue placeholder="Selecciona un submenú" />
              </SelectTrigger>
              <SelectContent>
                {availableSubmenus.map((submenu) => (
                  <SelectItem key={submenu.id} value={submenu.id}>
                    {submenu.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </>
    )
  }

  return null
}
