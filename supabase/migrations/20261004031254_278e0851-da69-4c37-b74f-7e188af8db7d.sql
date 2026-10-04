CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  starting_capital numeric NOT NULL DEFAULT 500000,
  default_risk_pct numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  trade_date date NOT NULL DEFAULT CURRENT_DATE,
  trade_time time,
  exchange text NOT NULL DEFAULT 'NSE',
  symbol text NOT NULL,
  segment text NOT NULL DEFAULT 'Equity Intraday',
  direction text NOT NULL DEFAULT 'Long',
  session text NOT NULL DEFAULT 'Opening',
  entry_price numeric NOT NULL,
  exit_price numeric,
  stop_loss numeric,
  take_profit numeric,
  quantity numeric NOT NULL DEFAULT 1,
  charges numeric NOT NULL DEFAULT 0,
  strategy text,
  emotion text,
  mistakes text,
  notes text,
  rating int,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trades TO authenticated;
GRANT ALL ON public.trades TO service_role;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own trades select" ON public.trades FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own trades insert" ON public.trades FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own trades update" ON public.trades FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own trades delete" ON public.trades FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX trades_user_date_idx ON public.trades (user_id, trade_date);