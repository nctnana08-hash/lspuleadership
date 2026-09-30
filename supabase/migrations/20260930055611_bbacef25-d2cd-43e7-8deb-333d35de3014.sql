CREATE TABLE public.org_scores (
  name text PRIMARY KEY,
  sort_order int NOT NULL DEFAULT 0,
  unity int, integrity int, stewardship int, collaboration int,
  final_rank int,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.org_scores TO anon, authenticated;
GRANT ALL ON public.org_scores TO service_role;
ALTER TABLE public.org_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view scores" ON public.org_scores FOR SELECT USING (true);
CREATE POLICY "Anyone can update scores" ON public.org_scores FOR UPDATE USING (true) WITH CHECK (true);
ALTER TABLE public.org_scores REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.org_scores;
INSERT INTO public.org_scores (name, sort_order) VALUES
('Fishery Student Council',1),('Association of Hospitality Management and Tourism Students',2),('LSPU-LB Reserve Officers'' Training Corps Unit',3),('CFND Student Organization',4),('College of Computer Studies - Student Council',5),('College of Teacher Education - Student Council',6),('Junior Financial Executives',7),('BTLED Society',8),('BEED Organization',9),('Social Studies Society',10),('Physical Education Society',11),('College of Criminal Justice Education Student Organization',12),('Psychology Society',13),('Ka-Peer Yu Organization',14),('Society of English Majors',15),('T.A.N.G.L.A.W.',16),('Kinetic Society',17),('BTVTED Society',18),('Mathematical Society',19),('Legion of Lures Esports',20),('Junior Philippine Institute of Accountants - Isometria',21),('Junior Marketing Association of the Philippines',22),('College of Business Administration and Accountancy - Student Council',23),('EsKultura: Eskwelahan ng Manlililok ng Kulturang Pilipino',24),('CO-Lab',25);