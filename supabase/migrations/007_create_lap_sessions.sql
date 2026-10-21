-- Finished sessions are immutable and stored atomically, including lap order.
-- Double precision preserves fractional milliseconds from performance.now().
CREATE FUNCTION public.valid_lap_times(laps DOUBLE PRECISION[], elapsed DOUBLE PRECISION)
RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE STRICT
SET search_path = ''
AS $$
    SELECT cardinality(laps) <= 10000
        AND (cardinality(laps) = 0 OR (array_ndims(laps) = 1 AND array_lower(laps, 1) = 1))
        AND NOT EXISTS (
            SELECT 1 FROM unnest(laps) AS lap
            WHERE lap IS NULL OR NOT (lap > 0 AND lap <= 604800000)
        )
        AND COALESCE((SELECT sum(lap) FROM unnest(laps) AS lap), 0) <= elapsed + 0.000001;
$$;

CREATE FUNCTION public.total_lap_time(laps DOUBLE PRECISION[])
RETURNS DOUBLE PRECISION
LANGUAGE sql IMMUTABLE STRICT
SET search_path = ''
AS $$
    SELECT COALESCE(sum(lap), 0) FROM unnest(laps) AS lap;
$$;

CREATE TABLE public.lap_sessions (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id UUID NOT NULL,
    started_at TIMESTAMPTZ NOT NULL CHECK (isfinite(started_at)),
    finished_at TIMESTAMPTZ NOT NULL CHECK (isfinite(finished_at) AND finished_at >= started_at),
    elapsed_ms DOUBLE PRECISION NOT NULL CHECK (elapsed_ms >= 0 AND elapsed_ms <= 604800000),
    laps_ms DOUBLE PRECISION[] NOT NULL CHECK (public.valid_lap_times(laps_ms, elapsed_ms)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    lap_count INTEGER GENERATED ALWAYS AS (cardinality(laps_ms)) STORED,
    completed_ms DOUBLE PRECISION GENERATED ALWAYS AS (public.total_lap_time(laps_ms)) STORED,
    PRIMARY KEY (user_id, id)
);

CREATE INDEX lap_sessions_user_started_idx ON public.lap_sessions (user_id, started_at DESC, id DESC);

ALTER TABLE public.lap_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lap_sessions FROM anon, authenticated;
GRANT SELECT, INSERT ON public.lap_sessions TO authenticated;

CREATE POLICY "Users can read their own lap sessions" ON public.lap_sessions
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can save their own lap sessions" ON public.lap_sessions
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

COMMENT ON TABLE public.lap_sessions IS 'Immutable finished lap sessions. Retry with the same user_id/id; never update existing rows.';
