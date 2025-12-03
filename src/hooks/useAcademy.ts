// src/hooks/useAcademy.ts
import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '@/lib/supabase';
import { Skill, Certification, InstructionRequest } from '@/types/database.types';

// 1. useSkills(): Fetches all rows from public.skills
export const useSkills = () => {
  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        if (!hasSupabase || !supabase) {
          throw new Error('Supabase client not configured.');
        }

        const { data, error: fetchError } = await supabase.from('skills').select('*');
        if (fetchError) throw fetchError;
        setSkills(data as Skill[]);
      } catch (err: any) {
        console.error("Error fetching skills:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  return { skills, loading, error };
};

// 2. useMyCertifications(userId): Fetches certifications for the current user.
export const useMyCertifications = (userId: string | undefined) => {
  const [certifications, setCertifications] = useState<Certification[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setCertifications(null);
      setLoading(false);
      return;
    }

    const fetchCertifications = async () => {
      try {
        setLoading(true);
        if (!hasSupabase || !supabase) {
          throw new Error('Supabase client not configured.');
        }

        const { data, error: fetchError } = await supabase
          .from('certifications')
          .select('*')
          .eq('user_id', userId);

        if (fetchError) throw fetchError;
        setCertifications(data as Certification[]);
      } catch (err: any) {
        console.error(`Error fetching certifications for user ${userId}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCertifications();
  }, [userId]);

  return { certifications, loading, error };
};

// 3. useRequestInstruction(): A function that inserts a new row into instruction_requests.
export const useRequestInstruction = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<InstructionRequest | null>(null);

  const requestInstruction = async (skillId: string, cadetId: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!hasSupabase || !supabase) {
        throw new Error('Supabase client not configured.');
      }

      const { data: insertData, error: insertError } = await supabase
        .from('instruction_requests')
        .insert({ skill_id: skillId, cadet_id: cadetId, status: 'PENDING' })
        .select()
        .single();

      if (insertError) throw insertError;
      setData(insertData as InstructionRequest);
      return insertData; // Return for immediate use
    } catch (err: any) {
      console.error("Error requesting instruction:", err);
      setError(err);
      return { error: err }; // Return error for immediate use
    } finally {
      setLoading(false);
    }
  };

  return { requestInstruction, loading, error, data };
};
