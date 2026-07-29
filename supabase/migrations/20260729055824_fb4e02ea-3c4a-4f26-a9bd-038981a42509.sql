ALTER TABLE public.technicians
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text;

UPDATE public.technicians t
SET contact_email = lower(u.email)
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE t.profile_id = p.id
  AND t.contact_email IS NULL
  AND u.email IS NOT NULL;

WITH technician_phones AS (
  SELECT
    t.id,
    p.phone,
    regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') AS normalized_phone,
    count(*) OVER (PARTITION BY regexp_replace(coalesce(p.phone, ''), '\D', '', 'g')) AS phone_count
  FROM public.technicians t
  JOIN public.profiles p ON p.id = t.profile_id
  WHERE p.phone IS NOT NULL
)
UPDATE public.technicians t
SET contact_phone = tp.phone
FROM technician_phones tp
WHERE t.id = tp.id
  AND t.contact_phone IS NULL
  AND tp.normalized_phone <> ''
  AND tp.phone_count = 1;

ALTER TABLE public.technicians
  ADD CONSTRAINT technicians_profile_id_key UNIQUE (profile_id);

CREATE UNIQUE INDEX IF NOT EXISTS technicians_contact_email_unique
  ON public.technicians (lower(contact_email))
  WHERE contact_email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS technicians_contact_phone_unique
  ON public.technicians ((regexp_replace(contact_phone, '\D', '', 'g')))
  WHERE contact_phone IS NOT NULL
    AND regexp_replace(contact_phone, '\D', '', 'g') <> '';

CREATE OR REPLACE FUNCTION private.current_technician_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $function$
  SELECT t.id
  FROM public.technicians t
  JOIN public.profiles p ON p.id = t.profile_id
  WHERE p.user_id = auth.uid()
  ORDER BY t.is_approved DESC, t.created_at ASC, t.id ASC
  LIMIT 1
$function$;