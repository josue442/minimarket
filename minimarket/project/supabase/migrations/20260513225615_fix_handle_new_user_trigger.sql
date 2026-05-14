/*
  # Fix handle_new_user trigger for null full_name

  1. Changes
    - Update handle_new_user function to use COALESCE for full_name
    - If full_name is null, default to 'Usuario'
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, has_discount)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario'), true);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
