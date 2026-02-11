"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GripVertical, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { FormFieldDefinition, FormFieldType } from "@/types/form-page";
import { FORM_FIELD_TYPE_LABELS } from "@/types/form-page";
import { FormFieldConfig } from "./form-field-config";

interface FormFieldsBuilderProps {
  fields: FormFieldDefinition[];
  onFieldsChange: (fields: FormFieldDefinition[]) => void;
  onAddField: (type: FormFieldType) => void;
  onRemoveField: (fieldId: string) => void;
  onUpdateField: (fieldId: string, updates: Partial<FormFieldDefinition>) => void;
}

// Add field type menu items
const FIELD_TYPES: FormFieldType[] = ["text", "email", "phone", "textarea", "select", "radio", "checkbox", "number", "date", "address"];

// Sortable field item
function SortableFieldItem({
  field,
  onUpdate,
  onRemove,
  isExpanded,
  onToggleExpand,
}: {
  field: FormFieldDefinition;
  onUpdate: (updates: Partial<FormFieldDefinition>) => void;
  onRemove: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg bg-background">
      {/* Header - always visible */}
      <div className="flex items-center gap-2 p-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 flex items-center gap-2 cursor-pointer" onClick={onToggleExpand}>
          <span className="text-xs font-medium text-muted-foreground uppercase">
            {FORM_FIELD_TYPE_LABELS[field.type]}
          </span>
          <span className="font-medium">{field.label || "Sin nombre"}</span>
          {field.required && <span className="text-xs text-red-500">*</span>}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onToggleExpand}>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {/* Expanded config - collapsible */}
      {isExpanded && (
        <div className="border-t px-3 pb-3 pt-3">
          <FormFieldConfig field={field} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

export function FormFieldsBuilder({
  fields,
  onFieldsChange,
  onAddField,
  onRemoveField,
  onUpdateField,
}: FormFieldsBuilderProps) {
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      onFieldsChange(arrayMove(fields, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-3">
      {fields.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>No hay campos aún</p>
          <p className="text-sm">Agrega campos usando el botón de abajo</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {fields.map((field) => (
                <SortableFieldItem
                  key={field.id}
                  field={field}
                  onUpdate={(updates) => onUpdateField(field.id, updates)}
                  onRemove={() => onRemoveField(field.id)}
                  isExpanded={expandedFieldId === field.id}
                  onToggleExpand={() =>
                    setExpandedFieldId(expandedFieldId === field.id ? null : field.id)
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add field dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Agregar Campo
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {FIELD_TYPES.map((type) => (
            <DropdownMenuItem key={type} onClick={() => onAddField(type)}>
              {FORM_FIELD_TYPE_LABELS[type]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
