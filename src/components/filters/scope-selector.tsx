"use client";

import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, ChevronRight, CheckSquare, MoreVertical, Layers, Info } from "lucide-react";
import { FilterScope } from "@/types/filters";
import { WebsiteCategory } from "@/types";

interface ScopeSelectorProps {
  value: FilterScope;
  onValueChange: (scope: FilterScope) => void;
  categories: WebsiteCategory[];
  disabled?: boolean;
}

export function ScopeSelector({
  value,
  onValueChange,
  categories,
  disabled = false,
}: ScopeSelectorProps) {
  const [isScopeExpanded, setIsScopeExpanded] = useState<boolean>(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Debug: Log categories when they change
  useEffect(() => {
    if (categories && categories.length > 0) {
      console.log("ScopeSelector: Categories loaded", categories.length);
    } else {
      console.log("ScopeSelector: No categories available");
    }
  }, [categories]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleMenu = (menuId: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  const expandAll = () => {
    const allCategoryIds = new Set<string>();
    const allMenuIds = new Set<string>();
    
    categories.forEach((category) => {
      allCategoryIds.add(category.id);
      category.menus.forEach((menu) => {
        allMenuIds.add(menu.id);
      });
    });
    
    setExpandedCategories(allCategoryIds);
    setExpandedMenus(allMenuIds);
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
    setExpandedMenus(new Set());
  };

  // Check if all categories and menus are expanded
  const isAllExpanded = useMemo(() => {
    if (categories.length === 0) return false;
    
    const allCategoryIds = new Set<string>();
    const allMenuIds = new Set<string>();
    
    categories.forEach((category) => {
      allCategoryIds.add(category.id);
      category.menus.forEach((menu) => {
        allMenuIds.add(menu.id);
      });
    });
    
    const allCategoriesExpanded = allCategoryIds.size > 0 && 
      Array.from(allCategoryIds).every(id => expandedCategories.has(id));
    const allMenusExpanded = allMenuIds.size > 0 && 
      Array.from(allMenuIds).every(id => expandedMenus.has(id));
    
    return allCategoriesExpanded && allMenusExpanded;
  }, [categories, expandedCategories, expandedMenus]);

  const toggleExpandCollapse = () => {
    if (isAllExpanded) {
      collapseAll();
    } else {
      expandAll();
    }
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    const newScope = { ...value };
    if (checked) {
      if (!newScope.categories.includes(categoryId)) {
        newScope.categories = [...newScope.categories, categoryId];
      }
    } else {
      newScope.categories = newScope.categories.filter((id) => id !== categoryId);
    }
    onValueChange(newScope);
  };

  const handleMenuToggle = (menuId: string, checked: boolean) => {
    const newScope = { ...value };
    if (checked) {
      if (!newScope.menus.includes(menuId)) {
        newScope.menus = [...newScope.menus, menuId];
      }
    } else {
      newScope.menus = newScope.menus.filter((id) => id !== menuId);
    }
    onValueChange(newScope);
  };

  const handleSubmenuToggle = (submenuId: string, checked: boolean) => {
    const newScope = { ...value };
    if (checked) {
      if (!newScope.submenus.includes(submenuId)) {
        newScope.submenus = [...newScope.submenus, submenuId];
      }
    } else {
      newScope.submenus = newScope.submenus.filter((id) => id !== submenuId);
    }
    onValueChange(newScope);
  };

  // Bulk selection functions (toggle behavior)
  const selectAllCategories = (includeMenus: boolean = false, includeSubmenus: boolean = false) => {
    const newScope = { ...value };
    
    // Collect all items that should be selected
    const allCategoryIds: string[] = [];
    const allMenuIds: string[] = [];
    const allSubmenuIds: string[] = [];
    
    categories.forEach((category) => {
      allCategoryIds.push(category.id);
      
      if (includeMenus) {
        category.menus.forEach((menu) => {
          allMenuIds.push(menu.id);
          
          if (includeSubmenus) {
            menu.submenus.forEach((submenu) => {
              allSubmenuIds.push(submenu.id);
            });
          }
        });
      }
    });
    
    // Check if all are already selected
    const allCategoriesSelected = allCategoryIds.every(id => newScope.categories.includes(id));
    const allMenusSelected = includeMenus ? allMenuIds.every(id => newScope.menus.includes(id)) : true;
    const allSubmenusSelected = includeSubmenus ? allSubmenuIds.every(id => newScope.submenus.includes(id)) : true;
    const allSelected = allCategoriesSelected && allMenusSelected && allSubmenusSelected;
    
    if (allSelected) {
      // Deselect all
      newScope.categories = newScope.categories.filter(id => !allCategoryIds.includes(id));
      if (includeMenus) {
        newScope.menus = newScope.menus.filter(id => !allMenuIds.includes(id));
      }
      if (includeSubmenus) {
        newScope.submenus = newScope.submenus.filter(id => !allSubmenuIds.includes(id));
      }
    } else {
      // Select all
      allCategoryIds.forEach((id) => {
        if (!newScope.categories.includes(id)) {
          newScope.categories = [...newScope.categories, id];
        }
      });
      
      if (includeMenus) {
        allMenuIds.forEach((id) => {
          if (!newScope.menus.includes(id)) {
            newScope.menus = [...newScope.menus, id];
          }
        });
      }
      
      if (includeSubmenus) {
        allSubmenuIds.forEach((id) => {
          if (!newScope.submenus.includes(id)) {
            newScope.submenus = [...newScope.submenus, id];
          }
        });
      }
    }
    
    onValueChange(newScope);
  };

  const selectAllMenusInCategory = (categoryId: string, includeSubmenus: boolean = false) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const newScope = { ...value };
    
    // Collect all items that should be selected
    const allMenuIds: string[] = [];
    const allSubmenuIds: string[] = [];
    
    category.menus.forEach((menu) => {
      allMenuIds.push(menu.id);
      
      if (includeSubmenus) {
        menu.submenus.forEach((submenu) => {
          allSubmenuIds.push(submenu.id);
        });
      }
    });
    
    // Check if all are already selected
    const allMenusSelected = allMenuIds.every(id => newScope.menus.includes(id));
    const allSubmenusSelected = includeSubmenus ? allSubmenuIds.every(id => newScope.submenus.includes(id)) : true;
    const allSelected = allMenusSelected && allSubmenusSelected;
    
    if (allSelected) {
      // Deselect all
      newScope.menus = newScope.menus.filter(id => !allMenuIds.includes(id));
      if (includeSubmenus) {
        newScope.submenus = newScope.submenus.filter(id => !allSubmenuIds.includes(id));
      }
    } else {
      // Select all
      allMenuIds.forEach((id) => {
        if (!newScope.menus.includes(id)) {
          newScope.menus = [...newScope.menus, id];
        }
      });
      
      if (includeSubmenus) {
        allSubmenuIds.forEach((id) => {
          if (!newScope.submenus.includes(id)) {
            newScope.submenus = [...newScope.submenus, id];
          }
        });
      }
    }
    
    onValueChange(newScope);
  };

  const selectAllSubmenusInMenu = (menuId: string) => {
    const newScope = { ...value };
    
    // Find the menu and collect all submenu IDs
    const allSubmenuIds: string[] = [];
    
    categories.forEach((category) => {
      category.menus.forEach((menu) => {
        if (menu.id === menuId) {
          menu.submenus.forEach((submenu) => {
            allSubmenuIds.push(submenu.id);
          });
        }
      });
    });
    
    // Check if all are already selected
    const allSelected = allSubmenuIds.length > 0 && allSubmenuIds.every(id => newScope.submenus.includes(id));
    
    if (allSelected) {
      // Deselect all
      newScope.submenus = newScope.submenus.filter(id => !allSubmenuIds.includes(id));
    } else {
      // Select all
      allSubmenuIds.forEach((id) => {
        if (!newScope.submenus.includes(id)) {
          newScope.submenus = [...newScope.submenus, id];
        }
      });
    }
    
    onValueChange(newScope);
  };

  const selectedCount =
    value.categories.length + value.menus.length + value.submenus.length;

  return (
    <div className="space-y-2">
      <Collapsible open={isScopeExpanded} onOpenChange={setIsScopeExpanded}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              disabled={disabled}
            >
              <div className="flex items-center gap-2">
                {isScopeExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Label className="cursor-pointer">Alcance del Filtro</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Seleccionar una categoría, menú o submenú hará que el filtro se muestre en el panel de filtros de esa categoría, menú o submenú de forma independiente. Puede seleccionar más de una categoría, menú o submenú para hacer el filtro disponible en múltiples categorías, menús o submenús.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xs text-muted-foreground">
                Define dónde se mostrará este filtro en el sitio web
              </p>
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <Badge variant="secondary">{selectedCount} seleccionado(s)</Badge>
            )}
            {categories && categories.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleExpandCollapse}
                  disabled={disabled}
                  title={isAllExpanded ? "Plegar todas las categorías y menús" : "Desplegar todas las categorías y menús"}
                >
                  {isAllExpanded ? (
                    <>
                      <ChevronRight className="h-4 w-4 mr-1" />
                      Plegar todo
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Desplegar todo
                    </>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={disabled}>
                      <Layers className="h-4 w-4 mr-1" />
                      Seleccionar todo
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => selectAllCategories(false, false)}
                      disabled={disabled}
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Solo categorías
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => selectAllCategories(true, false)}
                      disabled={disabled}
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Categorías + Menús
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => selectAllCategories(true, true)}
                      disabled={disabled}
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Categorías + Menús + Submenús
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
        <CollapsibleContent>
          <Card className="mt-2">
        <CardContent className="pt-4">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {!categories || categories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  No hay categorías disponibles
                </p>
                <p className="text-xs text-muted-foreground">
                  Asegúrate de tener categorías creadas en{" "}
                  <span className="font-medium">Página Web → Categorías</span>
                </p>
              </div>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="space-y-1">
                  {/* Category Row */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={value.categories.includes(category.id)}
                      onCheckedChange={(checked) =>
                        handleCategoryToggle(category.id, checked === true)
                      }
                      disabled={disabled}
                    />
                    <Label
                      htmlFor={`category-${category.id}`}
                      className="flex-1 cursor-pointer font-medium"
                    >
                      {category.nombreVisible || category.name}
                    </Label>
                    {category.menus.length > 0 && (
                      <>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="p-1 hover:bg-muted rounded"
                              disabled={disabled}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => selectAllMenusInCategory(category.id, false)}
                              disabled={disabled}
                            >
                              <CheckSquare className="h-4 w-4 mr-2" />
                              Seleccionar todos los menús
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => selectAllMenusInCategory(category.id, true)}
                              disabled={disabled}
                            >
                              <CheckSquare className="h-4 w-4 mr-2" />
                              Seleccionar menús + submenús
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Collapsible
                          open={expandedCategories.has(category.id)}
                          onOpenChange={() => toggleCategory(category.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <button
                              type="button"
                              className="p-1 hover:bg-muted rounded"
                              disabled={disabled}
                            >
                              {expandedCategories.has(category.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </CollapsibleTrigger>
                        </Collapsible>
                      </>
                    )}
                  </div>
                  
                  {/* Menus Accordion */}
                  {category.menus.length > 0 && (
                    <Collapsible
                      open={expandedCategories.has(category.id)}
                      onOpenChange={() => toggleCategory(category.id)}
                    >
                      <CollapsibleContent>
                        <div className="ml-4 mt-1 space-y-2">
                          {category.menus.map((menu) => (
                            <div key={menu.id} className="space-y-1">
                              {/* Menu Row */}
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`menu-${menu.id}`}
                                  checked={value.menus.includes(menu.id)}
                                  onCheckedChange={(checked) =>
                                    handleMenuToggle(menu.id, checked === true)
                                  }
                                  disabled={disabled}
                                />
                                <Label
                                  htmlFor={`menu-${menu.id}`}
                                  className="flex-1 cursor-pointer text-sm"
                                >
                                  {menu.nombreVisible || menu.name}
                                </Label>
                                {menu.submenus.length > 0 && (
                                  <>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          type="button"
                                          className="p-1 hover:bg-muted rounded"
                                          disabled={disabled}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreVertical className="h-3 w-3 text-muted-foreground" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => selectAllSubmenusInMenu(menu.id)}
                                          disabled={disabled}
                                        >
                                          <CheckSquare className="h-4 w-4 mr-2" />
                                          Seleccionar todos los submenús
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Collapsible
                                      open={expandedMenus.has(menu.id)}
                                      onOpenChange={() => toggleMenu(menu.id)}
                                    >
                                      <CollapsibleTrigger asChild>
                                        <button
                                          type="button"
                                          className="p-1 hover:bg-muted rounded"
                                          disabled={disabled}
                                        >
                                          {expandedMenus.has(menu.id) ? (
                                            <ChevronDown className="h-3 w-3" />
                                          ) : (
                                            <ChevronRight className="h-3 w-3" />
                                          )}
                                        </button>
                                      </CollapsibleTrigger>
                                    </Collapsible>
                                  </>
                                )}
                              </div>
                              
                              {/* Submenus Accordion */}
                              {menu.submenus.length > 0 && (
                                <Collapsible
                                  open={expandedMenus.has(menu.id)}
                                  onOpenChange={() => toggleMenu(menu.id)}
                                >
                                  <CollapsibleContent>
                                    <div className="ml-4 mt-1 space-y-1">
                                      {menu.submenus.map((submenu) => (
                                        <div
                                          key={submenu.id}
                                          className="flex items-center gap-2"
                                        >
                                          <Checkbox
                                            id={`submenu-${submenu.id}`}
                                            checked={value.submenus.includes(
                                              submenu.id
                                            )}
                                            onCheckedChange={(checked) =>
                                              handleSubmenuToggle(
                                                submenu.id,
                                                checked === true
                                              )
                                            }
                                            disabled={disabled}
                                          />
                                          <Label
                                            htmlFor={`submenu-${submenu.id}`}
                                            className="flex-1 cursor-pointer text-sm text-muted-foreground"
                                          >
                                            {submenu.nombreVisible ||
                                              submenu.name}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              )}
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      </CollapsibleContent>
      </Collapsible>
      {selectedCount === 0 && categories && categories.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Selecciona al menos una categoría, menú o submenú para aplicar el
          filtro. Puedes seleccionar múltiples opciones de forma independiente.
        </p>
      )}
    </div>
  );
}

