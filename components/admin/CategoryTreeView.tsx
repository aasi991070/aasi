"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  deleteCategoryAction,
  reorderCategoriesAction,
} from "@/lib/actions/catalog";
import { useUiStore } from "@/hooks/useUiStore";
import type { Category } from "@/types";

interface CategoryTreeViewProps {
  categories: Category[];
}

function SortableNode({
  category,
  depth,
  onDelete,
  disabled,
}: {
  category: Category;
  depth: number;
  onDelete: (id: string) => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: category.id, disabled });

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
          className="cursor-grab v18-text-muted disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
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
          disabled={disabled}
          onClick={() => onDelete(category.id)}
          className="rounded p-1 v18-text-muted v18-hover-danger disabled:opacity-50"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {expanded && hasChildren ? (
        <CategoryNodes
          categories={category.children!}
          depth={depth + 1}
          onDelete={onDelete}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}

function CategoryNodes({
  categories,
  depth,
  onDelete,
  disabled,
}: {
  categories: Category[];
  depth: number;
  onDelete: (id: string) => void;
  disabled: boolean;
}) {
  const ids = categories.map((category) => category.id);

  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      {categories.map((category) => (
        <SortableNode
          key={category.id}
          category={category}
          depth={depth}
          onDelete={onDelete}
          disabled={disabled}
        />
      ))}
    </SortableContext>
  );
}

export function CategoryTreeView({ categories }: CategoryTreeViewProps) {
  const router = useRouter();
  const { showToast } = useUiStore();
  const [isPending, startTransition] = useTransition();
  const [localTree, setLocalTree] = useState(categories);

  useEffect(() => {
    setLocalTree(categories);
  }, [categories]);

  const rootIds = useMemo(() => localTree.map((category) => category.id), [localTree]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const reorderSiblings = (nodes: Category[]): Category[] => {
      const oldIndex = nodes.findIndex((node) => node.id === active.id);
      const newIndex = nodes.findIndex((node) => node.id === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return nodes.map((node) => ({
          ...node,
          children: node.children ? reorderSiblings(node.children) : undefined,
        }));
      }
      const updated = [...nodes];
      const [moved] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, moved);
      return updated.map((node, index) => ({ ...node, sort_order: index }));
    };

    const previous = localTree;
    const updated = reorderSiblings(localTree);
    setLocalTree(updated);

    const items = updated.map((category, index) => ({
      id: category.id,
      sort_order: index,
    }));

    startTransition(async () => {
      const result = await reorderCategoriesAction(items);
      if (result.ok) {
        showToast("Order updated", "success");
        router.refresh();
        return;
      }

      setLocalTree(previous);
      showToast(result.message, "error");
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this category?")) return;

    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (result.ok) {
        showToast("Category deleted", "success");
        router.refresh();
        return;
      }
      showToast(result.message, "error");
    });
  };

  return (
    <div className="v18-card p-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={rootIds} strategy={verticalListSortingStrategy}>
          {localTree.map((category) => (
            <SortableNode
              key={category.id}
              category={category}
              depth={0}
              onDelete={handleDelete}
              disabled={isPending}
            />
          ))}
        </SortableContext>
      </DndContext>

      {localTree.length === 0 ? (
        <div className="py-12 text-center text-sm v18-text-muted">
          No categories yet.{" "}
          <Button asChild variant="link" className="p-0">
            <Link href="/admin/dashboard/categories/new">Add one</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
