import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableItem({
  id,
  children,
  dragHandle,
}: {
  id: string;
  children: React.ReactNode;
  dragHandle: React.ReactNode; // Pass the drag handle as a prop
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging || isOver ? transition : "none", // Disable animation while dragging
    opacity: isDragging ? 0.8 : 1, // Slightly fade the item while dragging
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      <div className="flex items-start space-x-2">
        {/* Render the drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab"
          tabIndex={-1}
        >
          {dragHandle}
        </div>
        {/* Render the rest of the content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
