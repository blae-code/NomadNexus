import React, { useState } from 'react';
import { useCampfires } from '@/hooks/useCampfires';
import { hasMinRank } from '@/components/permissions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Flame, Users, Trash2, LogIn, LogOut, Plus } from 'lucide-react';

const CampfireManager = ({ user }) => {
  const [newCampfireName, setNewCampfireName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const {
    campfires,
    isLoading,
    createCampfire,
    joinCampfire,
    leaveCampfire,
    douseCampfire,
  } = useCampfires(user?.id);

  const canCreateCampfire = hasMinRank(user?.rank, 'scout');

  const handleCreateCampfire = () => {
    if (!newCampfireName.trim()) {
      return;
    }
    createCampfire({ name: newCampfireName, creatorId: user.id });
    setNewCampfireName('');
    setShowCreateForm(false);
  };

  const isMemberOfCampfire = (campfire) => {
    return campfire.campfire_members?.some(m => m.user_id === user?.id);
  };

  const isCreatorOfCampfire = (campfire) => {
    return campfire.creator_id === user?.id;
  };

  if (isLoading) {
    return <div className="text-zinc-400 text-sm">Loading campfires...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-emerald-400 font-semibold text-lg flex items-center gap-2">
          <Flame className="w-5 h-5" />
          Campfires
        </h3>
        {canCreateCampfire && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="border-emerald-500 text-emerald-400 hover:bg-emerald-950"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Campfire
          </Button>
        )}
      </div>

      {/* Create Campfire Form */}
      {showCreateForm && canCreateCampfire && (
        <Card className="p-4 bg-zinc-900 border-emerald-500">
          <div className="space-y-2">
            <Input
              placeholder="Campfire name..."
              value={newCampfireName}
              onChange={(e) => setNewCampfireName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCampfire()}
              className="bg-black border-zinc-700 text-white"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreateCampfire}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Create
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewCampfireName('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Campfire List */}
      <div className="space-y-2">
        {campfires.map((campfire) => {
          const isMember = isMemberOfCampfire(campfire);
          const isCreator = isCreatorOfCampfire(campfire);
          const memberCount = campfire.campfire_members?.length || 0;
          const isBonfire = campfire.is_bonfire;

          return (
            <Card
              key={campfire.id}
              className={`p-3 ${
                campfire.is_lit
                  ? 'bg-gradient-to-r from-orange-950 to-zinc-900 border-orange-500'
                  : 'bg-zinc-900 border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Flame
                    className={`w-5 h-5 ${
                      campfire.is_lit ? 'text-orange-400' : 'text-zinc-600'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {campfire.name}
                      </span>
                      {isBonfire && (
                        <span className="text-xs bg-yellow-600 text-black px-2 py-0.5 rounded-full font-bold">
                          PERMANENT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Users className="w-3 h-3" />
                      <span>{memberCount} gathered</span>
                      {campfire.is_lit ? (
                        <span className="text-orange-400">• Lit</span>
                      ) : (
                        <span className="text-zinc-500">• Unlit</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {isMember ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        leaveCampfire({ campfireId: campfire.id, userId: user.id })
                      }
                      className="border-zinc-600 text-zinc-300"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Leave
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() =>
                        joinCampfire({ campfireId: campfire.id, userId: user.id })
                      }
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <LogIn className="w-4 h-4 mr-1" />
                      Join
                    </Button>
                  )}

                  {isCreator && !isBonfire && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => douseCampfire({ campfireId: campfire.id })}
                      title="Douse and remove this campfire"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {campfires.length === 0 && (
          <div className="text-center text-zinc-500 py-8">
            No campfires yet. {canCreateCampfire && 'Create one to get started!'}
          </div>
        )}
      </div>

      {/* Permission Message */}
      {!canCreateCampfire && (
        <div className="text-xs text-zinc-500 italic">
          Scout rank or higher required to create campfires.
        </div>
      )}
    </div>
  );
};

export default CampfireManager;
