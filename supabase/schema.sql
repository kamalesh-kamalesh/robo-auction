-- =============================================================================
-- ROBO AUCTION - OFFICIAL SUPABASE DATABASE SCHEMA
-- Quick-run file for Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.tournament_sessions (
    id TEXT PRIMARY KEY DEFAULT 'default-session',
    phase TEXT NOT NULL DEFAULT 'LOBBY',
    active_component_id TEXT,
    active_component_index INT NOT NULL DEFAULT 0,
    total_components INT NOT NULL DEFAULT 20,
    current_round INT NOT NULL DEFAULT 1,
    starting_budget NUMERIC(12, 2) NOT NULL DEFAULT 100000,
    time_left_seconds INT NOT NULL DEFAULT 0,
    is_paused BOOLEAN NOT NULL DEFAULT FALSE,
    is_results_published BOOLEAN NOT NULL DEFAULT FALSE,
    is_demo_mode BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teams (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    total_budget NUMERIC(12, 2) NOT NULL DEFAULT 100000,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 100000,
    spent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    is_eliminated BOOLEAN NOT NULL DEFAULT FALSE,
    is_connected BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_positive_total_budget CHECK (total_budget >= 0),
    CONSTRAINT chk_spent_amount CHECK (spent_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_teams_code ON public.teams(code);
CREATE INDEX IF NOT EXISTS idx_teams_is_eliminated ON public.teams(is_eliminated);

CREATE TABLE IF NOT EXISTS public.robot_components (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    order_num INT NOT NULL DEFAULT 0,
    is_open BOOLEAN NOT NULL DEFAULT FALSE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_robot_components_category ON public.robot_components(category);
CREATE INDEX IF NOT EXISTS idx_robot_components_order_num ON public.robot_components(order_num);

CREATE TABLE IF NOT EXISTS public.component_variants (
    id TEXT PRIMARY KEY,
    component_id TEXT NOT NULL REFERENCES public.robot_components(id) ON DELETE CASCADE,
    component_name TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('basic', 'advanced', 'pro')),
    starting_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    current_bid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    min_increment NUMERIC(12, 2) NOT NULL DEFAULT 500,
    highest_bidder_team_id TEXT REFERENCES public.teams(id) ON DELETE SET NULL,
    highest_bidder_team_name TEXT,
    winner_team_id TEXT REFERENCES public.teams(id) ON DELETE SET NULL,
    winning_bid_amount NUMERIC(12, 2),
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'SOLD')),
    capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_component_id ON public.component_variants(component_id);
CREATE INDEX IF NOT EXISTS idx_variants_status ON public.component_variants(status);
CREATE INDEX IF NOT EXISTS idx_variants_highest_bidder ON public.component_variants(highest_bidder_team_id);
CREATE INDEX IF NOT EXISTS idx_variants_winner ON public.component_variants(winner_team_id);

CREATE TABLE IF NOT EXISTS public.bids (
    id BIGSERIAL PRIMARY KEY,
    variant_id TEXT NOT NULL REFERENCES public.component_variants(id) ON DELETE CASCADE,
    component_id TEXT NOT NULL REFERENCES public.robot_components(id) ON DELETE CASCADE,
    team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    anti_snipe_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bids_variant_amount ON public.bids(variant_id, amount DESC);
CREATE INDEX IF NOT EXISTS idx_bids_team_id ON public.bids(team_id);
CREATE INDEX IF NOT EXISTS idx_bids_created_at ON public.bids(created_at DESC);

CREATE TABLE IF NOT EXISTS public.team_purchases (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL REFERENCES public.component_variants(id) ON DELETE CASCADE,
    component_id TEXT NOT NULL,
    component_name TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    tier TEXT NOT NULL,
    price_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    fair_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    surplus_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_purchases_team_id ON public.team_purchases(team_id);
CREATE INDEX IF NOT EXISTS idx_team_purchases_category ON public.team_purchases(category);

CREATE TABLE IF NOT EXISTS public.robot_assemblies (
    team_id TEXT PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
    robot_name TEXT,
    slots JSONB NOT NULL DEFAULT '{}'::jsonb,
    validation_status JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_valid BOOLEAN NOT NULL DEFAULT FALSE,
    total_capability_rating NUMERIC(5, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.testing_scores (
    team_id TEXT PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    rank INT NOT NULL DEFAULT 0,
    final_score NUMERIC(10, 2) NOT NULL DEFAULT 0,
    competition_score NUMERIC(10, 2) NOT NULL DEFAULT 0,
    remaining_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    surplus_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    capital_efficiency_bonus NUMERIC(10, 2) NOT NULL DEFAULT 0,
    synergy_score NUMERIC(10, 2) NOT NULL DEFAULT 0,
    hoarding_penalty NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_complete_robot_built BOOLEAN NOT NULL DEFAULT FALSE,
    is_eliminated BOOLEAN NOT NULL DEFAULT FALSE,
    task_results JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testing_scores_rank ON public.testing_scores(rank);
CREATE INDEX IF NOT EXISTS idx_testing_scores_final_score ON public.testing_scores(final_score DESC);

CREATE TABLE IF NOT EXISTS public.auction_snapshots (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL DEFAULT 'default-session',
    phase TEXT NOT NULL,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_snapshots_created_at ON public.auction_snapshots(created_at DESC);

ALTER TABLE public.tournament_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.robot_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.robot_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testing_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on tournament_sessions" ON public.tournament_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on teams" ON public.teams FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on robot_components" ON public.robot_components FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on component_variants" ON public.component_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on bids" ON public.bids FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on team_purchases" ON public.team_purchases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on robot_assemblies" ON public.robot_assemblies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read on testing_scores" ON public.testing_scores FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow service_role full control on tournament_sessions" ON public.tournament_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full control on teams" ON public.teams FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full control on robot_components" ON public.robot_components FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full control on component_variants" ON public.component_variants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full control on bids" ON public.bids FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full control on team_purchases" ON public.team_purchases FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full control on robot_assemblies" ON public.robot_assemblies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full control on testing_scores" ON public.testing_scores FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full control on auction_snapshots" ON public.auction_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_updated_at_tournament_sessions ON public.tournament_sessions;
CREATE TRIGGER trigger_set_updated_at_tournament_sessions BEFORE UPDATE ON public.tournament_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at_teams ON public.teams;
CREATE TRIGGER trigger_set_updated_at_teams BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at_component_variants ON public.component_variants;
CREATE TRIGGER trigger_set_updated_at_component_variants BEFORE UPDATE ON public.component_variants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
