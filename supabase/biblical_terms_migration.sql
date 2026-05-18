-- ============================================================
-- BIBLICAL TERMS — UPDATED MIGRATION (adds spanish_text column)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Create the table (if it doesn't exist yet)
create table if not exists biblical_terms (
  id uuid primary key default uuid_generate_v4(),
  term text not null,                    -- English term e.g. "Grace"
  spanish_text text not null default '', -- Spanish translation e.g. "Gracia"
  definition text not null,             -- Kid-friendly English definition (for context)
  scripture_ref text,                   -- e.g. "Ephesians 2:8"
  scripture_text text,                  -- Short verse snippet
  category text not null default 'Faith',
  -- Wrong answers for the quiz (Spanish words)
  distractor_1 text not null default '',
  distractor_2 text not null default '',
  distractor_3 text not null default '',
  emoji text not null default '✝️',
  difficulty int not null default 1 check (difficulty between 1 and 5),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- If the table already exists from a previous migration, add the spanish_text column
alter table biblical_terms add column if not exists spanish_text text not null default '';

alter table biblical_terms enable row level security;

-- Policies (safe to re-run)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='biblical_terms' and policyname='service_role_all_biblical_terms') then
    create policy "service_role_all_biblical_terms" on biblical_terms for all using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='biblical_terms' and policyname='anon_read_biblical_terms') then
    create policy "anon_read_biblical_terms" on biblical_terms for select using (true);
  end if;
end $$;

-- Progress tracking table
create table if not exists biblical_terms_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references child_profiles(id) on delete cascade,
  term_id uuid references biblical_terms(id) on delete cascade,
  mastery_level int not null default 0 check (mastery_level between 0 and 5),
  last_seen_at timestamptz,
  unique(user_id, term_id)
);

alter table biblical_terms_progress enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='biblical_terms_progress' and policyname='service_role_all_bible_progress') then
    create policy "service_role_all_bible_progress" on biblical_terms_progress for all using (true);
  end if;
end $$;

-- ============================================================
-- SEED: 20 Biblical Terms with Spanish translations
-- ============================================================
-- Clear existing seed data and re-insert cleanly
delete from biblical_terms;

insert into biblical_terms (term, spanish_text, definition, scripture_ref, scripture_text, category, emoji, distractor_1, distractor_2, distractor_3, difficulty, sort_order) values
  ('Grace',        'Gracia',          'God''s free gift of love and forgiveness — we don''t earn it!',                       'Ephesians 2:8',         'For it is by grace you have been saved, through faith.',                                                       'Salvation',         '🕊️', 'Gloria',      'Gracias',     'Grande',      1,  1),
  ('Faith',        'Fe',              'Trusting and believing in God even when we can''t see Him.',                           'Hebrews 11:1',          'Faith is confidence in what we hope for and assurance about what we do not see.',                              'Foundation',        '⭐',  'Fue',         'Fin',         'Flor',        1,  2),
  ('Prayer',       'Oración',         'Talking to God — like a conversation with your Heavenly Father!',                      'Philippians 4:6',       'In every situation, by prayer and petition, with thanksgiving, present your requests to God.',                 'Worship',           '🙏', 'Canción',     'Ocasión',     'Operación',   1,  3),
  ('Salvation',    'Salvación',       'Being rescued from sin by Jesus — the greatest gift ever!',                            'Romans 10:9',           'If you declare with your mouth, "Jesus is Lord," and believe in your heart, you will be saved.',               'Salvation',         '✝️', 'Sensación',   'Salud',       'Nación',      2,  4),
  ('Covenant',     'Pacto',           'A sacred promise between God and His people.',                                         'Genesis 9:13',          'I have set my rainbow in the clouds as a sign of the covenant between me and the earth.',                      'Promise',           '🌈', 'Pato',        'Palco',       'Pacífico',    2,  5),
  ('Repentance',   'Arrepentimiento', 'Turning away from wrong and choosing to follow God instead.',                          '1 John 1:9',            'If we confess our sins, he is faithful and just to forgive us our sins.',                                      'Salvation',         '🔄', 'Pensamiento', 'Apartamento', 'Sentimiento', 3,  6),
  ('Worship',      'Adoración',       'Showing love and praise to God through singing, praying, and honoring Him.',           'Psalm 95:6',            'Come, let us bow down in worship, let us kneel before the Lord our Maker.',                                   'Worship',           '🎵', 'Oración',     'Nación',      'Admiración',  1,  7),
  ('Baptism',      'Bautismo',        'Going under the water as a sign that you''re new in Jesus!',                          'Matthew 28:19',         'Go and make disciples of all nations, baptizing them in the name of the Father, Son, and Holy Spirit.',        'Sacrament',         '💧', 'Bautista',    'Cautiverio',  'Fautismo',    2,  8),
  ('Disciple',     'Discípulo',       'A follower and student of Jesus who learns from Him every day.',                       'John 8:31',             'If you hold to my teaching, you are really my disciples.',                                                     'Foundation',        '👣', 'Disco',       'Principio',   'Dispuesto',   2,  9),
  ('Resurrection', 'Resurrección',    'Jesus rising from the dead — proving He conquered death for us!',                      'John 11:25',            'I am the resurrection and the life. The one who believes in me will live.',                                    'Foundation',        '✨', 'Renovación',  'Dirección',   'Selección',   3, 10),
  ('Gospel',       'Evangelio',       'The Good News that Jesus came to save us! "Evangelio" means Good News.',              'Mark 1:15',             'The kingdom of God has come near. Repent and believe the good news!',                                         'Foundation',        '📖', 'Evangelista', 'Aviso',       'Ángel',       2, 11),
  ('Trinity',      'Trinidad',        'God is three persons in one: Father, Son (Jesus), and Holy Spirit.',                  'Matthew 28:19',         'In the name of the Father and of the Son and of the Holy Spirit.',                                            'Foundation',        '🔱', 'Trino',       'Tridente',    'Trinchera',   4, 12),
  ('Holy Spirit',  'Espíritu Santo',  'God''s Spirit living inside believers to guide, comfort, and help them.',             'John 14:26',            'The Holy Spirit will teach you all things and remind you of everything I have said.',                           'Foundation',        '🕊️', 'Espejo',      'Espíritu',    'Santo Tomás', 3, 13),
  ('Mercy',        'Misericordia',    'When God doesn''t give us the punishment we deserve — He is kind instead!',           'Lamentations 3:22',     'Because of the Lord''s great love we are not consumed, for his compassions never fail.',                       'Character of God',  '💛', 'Maravilla',   'Victoria',    'Ministerio',  2, 14),
  ('Praise',       'Alabanza',        'Telling God how wonderful He is with our words, songs, and actions!',                 'Psalm 150:6',           'Let everything that has breath praise the Lord.',                                                              'Worship',           '🎉', 'Alianza',     'Avanza',      'Andanza',     1, 15),
  ('Scripture',    'Escritura',       'The Bible — God''s written Word to us, true and full of wisdom.',                    '2 Timothy 3:16',        'All Scripture is God-breathed and is useful for teaching and training in righteousness.',                       'Foundation',        '📜', 'Escritorio',  'Estructura',  'Escultura',   2, 16),
  ('Atonement',    'Expiación',       'Jesus paying for our sins on the cross so we can be forgiven.',                      '1 John 2:2',            'He is the atoning sacrifice for our sins, and for the sins of the whole world.',                               'Salvation',         '⚖️', 'Nación',      'Oración',     'Aspiración',  4, 17),
  ('Sanctification','Santificación',  'God''s work of making us more and more like Jesus every day.',                        '1 Thessalonians 4:3',   'It is God''s will that you should be sanctified.',                                                            'Growth',            '🌱', 'Santísimo',   'Clasificación','Purificación', 4, 18),
  ('Prophecy',     'Profecía',        'A special message from God about the future, spoken through a prophet.',              '2 Peter 1:21',          'Prophets spoke from God as they were carried along by the Holy Spirit.',                                       'Scripture',         '🔮', 'Poesía',      'Filosofía',   'Fotografía',  3, 19),
  ('Redemption',   'Redención',       'Being bought back and set free! Jesus redeemed us from sin.',                        'Ephesians 1:7',         'In him we have redemption through his blood, the forgiveness of sins.',                                        'Salvation',         '🗝️', 'Rendición',   'Dirección',   'Elección',    3, 20);
