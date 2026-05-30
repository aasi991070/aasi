"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_LEVELS } from "@/constants";
import { useDeleteCategory, useReorderCategories } from "@/hooks/useCategories";
import { useUiStore } from "@/hooks/useUiStore";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@/types";

interface CategoryTreeViewProps {
  categories: Category[];
}

function SortableNode({
  category,
  depth,
  onDelete,
}: {
  category: Category;
  depth: number;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasChildren = (category.children?.length ?? 0) > 0;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className="flex items-center gap-2 rounded-lg py-2 pr-2 hover:bg-slate-50"
        style={{ paddingLeft: depth * 24 + 8 }}
      >
        <button
          type="button"
          className="cursor-grab v18-text-muted"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        {hasChildren ? (
          <button type="button" onClick={() => setExpanded(!expanded)}>
            {expanded ? (
              <ChevronDown className="size-4 v18-text-muted" />
            ) : (
              <ChevronRight className="size-4 v18-text-muted" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <span className="flex-1 text-sm font-medium v18-text-heading">
          {category.name}
        </span>

        <Badge variant="outline" className="text-xs">
          {CATEGORY_LEVELS[category.level]}
        </Badge>

        <Link
          href={`/admin/dashboard/categories/new?parent=${category.id}&level=${Math.min(category.level + 1, 4)}`}
          className="rounded p-1 v18-text-muted v18-hover-accent"
        >
          <Plus className="size-4" />
        </Link>
        <Link
          href={`/admin/dashboard/categories/${category.id}`}
          className="rounded p-1 v18-text-muted hover:bg-slate-100"
        >
          <Pencil className="size-4" />
        </Link>
        <button
          type="button"
          onClick={() => onDelete(category.id)}
          className="rounded p-1 v18-text-muted v18-hover-danger"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {expanded && hasChildren && (
        <CategoryNodes
          categories={category.children!}
          depth={depth + 1}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

function CategoryNodes({
  categories,
  depth,
  onDelete,
}: {
  categories: Category[];
  depth: number;
  onDelete: (id: string) => void;
}) {
  const ids = categories.map((c) => c.id);

  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      {categories.map((cat) => (
        <SortableNode key={cat.id} category={cat} depth={depth} onDelete={onDelete} />
      ))}
    </SortableContext>
  );
}

export function CategoryTreeView({ categories }: CategoryTreeViewProps) {
  const { showToast } = useUiStore();
  const deleteCategory = useDeleteCategory();
  const reorderCategories = useReorderCategories();
  const [localTree, setLocalTree] = useState(categories);

  const rootIds = useMemo(() => localTree.map((c) => c.id), [localTree]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const reorderSiblings = (nodes: Category[]): Category[] => {
      const oldIndex = nodes.findIndex((n) => n.id === active.id);
      const newIndex = nodes.findIndex((n) => n.id === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return nodes.map((n) => ({
          ...n,
          children: n.children ? reorderSiblings(n.children) : undefined,
        }));
      }
      const updated = [...nodes];
      const [moved] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, moved);
      return updated.map((n, i) => ({ ...n, sort_order: i }));
    };

    const updated = reorderSiblings(localTree);
    setLocalTree(updated);

    const items = updated.map((c, i) => ({ id: c.id, sort_order: i }));
    try {
      await reorderCategories.mutateAsync(items);
      showToast("Order updated", "success");
    } catch {
      showToast("Failed to update order", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory.mutateAsync(id);
      showToast("Category deleted", "success");
    } catch {
      showToast("Failed to delete category", "error");
    }
  };

  return (
    <div className="v18-card p-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rootIds} strategy={verticalListSortingStrategy}>
          {localTree.map((cat) => (
            <SortableNode key={cat.id} category={cat} depth={0} onDelete={handleDelete} />
          ))}
        </SortableContext>
      </DndContext>

      {localTree.length === 0 && (
        <div className="py-12 text-center text-sm v18-text-muted">
          No categories yet.{" "}
          <Button asChild variant="link" className="p-0">
            <Link href="/admin/dashboard/categories/new">Add one</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
