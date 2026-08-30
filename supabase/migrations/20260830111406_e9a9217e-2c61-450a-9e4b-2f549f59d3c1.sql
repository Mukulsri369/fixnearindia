GRANT SELECT (
  display_name, headline, description, technician_type, contact_email, contact_phone,
  gst_number, whatsapp_number, segments, service_modes, availability, pricing, workshop,
  business, experience_months, onboarding_status, completion_percent, review_notes,
  submitted_at, reviewed_at
) ON public.technicians TO authenticated;

GRANT SELECT (
  display_name, headline, description, technician_type, segments, service_modes
) ON public.technicians TO anon;