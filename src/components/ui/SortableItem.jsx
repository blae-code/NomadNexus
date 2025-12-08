import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableItem({ id, children, isEditing }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isEditing === false });

  const style = {
    transform: `${CSS.Transform.toString(transform)} scale(${isDragging ? 1.05 : 1})`,
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.9 : 1,
    animation: isEditing && !isDragging ? 'wiggle 0.5s ease-in-out infinite' : 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}
