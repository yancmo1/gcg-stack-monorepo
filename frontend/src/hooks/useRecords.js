import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE || 'http://localhost:6001/api';

// Zod schema for a record
export const recordSchema = z.object({
  id: z.number().optional(),
  employee_name: z.string().min(1, 'Employee name required'),
  title: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  completion_date: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  sort_order: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  trainer: z.string().optional().nullable(),
  mtl_completed: z.string().optional().nullable(),
  new_hire_test_score: z.union([z.string(), z.number()]).optional().nullable(),
  group: z.string().optional().nullable()
});

export function useRecords() {
  const qc = useQueryClient();

  const recordsQuery = useQuery({
    queryKey: ['records'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/records`);
      if (!res.ok) throw new Error('Failed to fetch records');
      const data = await res.json();
      if (Array.isArray(data)) {
        // Use safeParse to avoid throwing on partial/malformed records
        return data.map(r => {
          const parsed = recordSchema.partial().safeParse(r);
          return parsed.success ? parsed.data : r;
        });
      }
      return (data.items || []).map(r => {
        const parsed = recordSchema.partial().safeParse(r);
        return parsed.success ? parsed.data : r;
      });
    }
  });

  const addRecord = useMutation({
    mutationFn: async (payload) => {
      const parsed = recordSchema.omit({ id: true }).parse(payload);
      const res = await fetch(`${API_BASE}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Add record failed');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['records'] })
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, data }) => {
      const parsed = recordSchema.partial().parse(data);
      const res = await fetch(`${API_BASE}/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['records'] })
  });

  const deleteRecord = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API_BASE}/records/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['records'] })
  });

  return { recordsQuery, addRecord, updateRecord, deleteRecord };
}
