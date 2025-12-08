-- Check the current rank values in the profiles table
SELECT id, email, callsign, rank, created_at, updated_at 
FROM profiles 
ORDER BY updated_at DESC NULLS LAST
LIMIT 10;

-- Check if there's a default value on the rank column
SELECT 
    column_name, 
    column_default, 
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'rank';
