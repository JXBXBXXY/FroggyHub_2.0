import { supabase } from './_supabase.js';

export async function getPidByUserUuid(userUuid) {
  const { data, error } = await supabase
    .from('profiles')
    .select('pid')
    .eq('id', userUuid)
    .single();

  if (error) {
    throw new Error(`Cannot map user UUID → pid: ${error.message}`);
  }
  if (!data || typeof data.pid !== 'number') {
    throw new Error('Profile pid not found for this user.');
  }
  return data.pid;
}
