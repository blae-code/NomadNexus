import React from 'react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '@/components/ui/SortableItem';
import { PanelContainer, TechHeader } from './DashboardPanel';

const StandardDashboard = ({ panels, user, isEditing }) => {
  return (
    <div className="h-full w-full flex flex-col gap-3 p-3 bg-black">
      <SortableContext items={panels} strategy={rectSortingStrategy} disabled={!isEditing}>
        <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
          {panels.map(({ id, component: PanelComponent, title }) => (
            <SortableItem key={id} id={id} isEditing={isEditing}>
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <PanelContainer>
                  <TechHeader title={title} />
                  <div className="flex-1 p-3 overflow-hidden">
                    <PanelComponent user={user} />
                  </div>
                </PanelContainer>
              </div>
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default StandardDashboard;
