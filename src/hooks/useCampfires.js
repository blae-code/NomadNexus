import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useCampfires = (userId) => {
  const queryClient = useQueryClient();

  // Fetch all campfires
  const { data: campfires = [], isLoading } = useQuery({
    queryKey: ['campfires'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campfires')
        .select('*, campfire_members(user_id)')
        .order('is_bonfire', { ascending: false }) // Bonfire first
        .order('created_at');
      
      if (error) {
        console.error('Failed to fetch campfires:', error);
        return [];
      }
      return data || [];
    },
    refetchInterval: 5000,
  });

  // Create a new campfire
  const createCampfireMutation = useMutation({
    mutationFn: async ({ name, creatorId }) => {
      const { data, error } = await supabase
        .from('campfires')
        .insert({ name, creator_id: creatorId, is_lit: false })
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Campfire "${data.name}" created! Light it by joining.`);
      queryClient.invalidateQueries(['campfires']);
    },
    onError: (error) => {
      toast.error(`Failed to create campfire: ${error.message}`);
    },
  });

  // Join a campfire
  const joinCampfireMutation = useMutation({
    mutationFn: async ({ campfireId, userId }) => {
      // Insert member
      const { error: memberError } = await supabase
        .from('campfire_members')
        .insert({ campfire_id: campfireId, user_id: userId });
      
      if (memberError) throw new Error(memberError.message);

      // Light the campfire if not already lit
      const { error: updateError } = await supabase
        .from('campfires')
        .update({ is_lit: true })
        .eq('id', campfireId);
      
      if (updateError) throw new Error(updateError.message);
    },
    onSuccess: () => {
      toast.success('Joined campfire! The fire is lit.');
      queryClient.invalidateQueries(['campfires']);
    },
    onError: (error) => {
      toast.error(`Failed to join campfire: ${error.message}`);
    },
  });

  // Leave a campfire
  const leaveCampfireMutation = useMutation({
    mutationFn: async ({ campfireId, userId }) => {
      const { error } = await supabase
        .from('campfire_members')
        .delete()
        .eq('campfire_id', campfireId)
        .eq('user_id', userId);
      
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.info('Left campfire.');
      queryClient.invalidateQueries(['campfires']);
    },
    onError: (error) => {
      toast.error(`Failed to leave campfire: ${error.message}`);
    },
  });

  // Douse a campfire (creator only)
  const douseCampfireMutation = useMutation({
    mutationFn: async ({ campfireId }) => {
      // Remove all members first
      await supabase
        .from('campfire_members')
        .delete()
        .eq('campfire_id', campfireId);

      // Delete the campfire
      const { error } = await supabase
        .from('campfires')
        .delete()
        .eq('id', campfireId);
      
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Campfire doused and removed.');
      queryClient.invalidateQueries(['campfires']);
    },
    onError: (error) => {
      toast.error(`Failed to douse campfire: ${error.message}`);
    },
  });

  return {
    campfires,
    isLoading,
    createCampfire: createCampfireMutation.mutate,
    joinCampfire: joinCampfireMutation.mutate,
    leaveCampfire: leaveCampfireMutation.mutate,
    douseCampfire: douseCampfireMutation.mutate,
  };
};
