-- ============================================================
-- BIBLICAL TERMS (Christian families feature)
-- ============================================================
create table if not exists biblical_terms (
  id uuid primary key default uuid_generate_v4(),
  term text not null,                    -- e.g. "Grace"
  definition text not null,             -- kid-friendly definition
  scripture_ref text,                   -- e.g. "Ephesians 2:8"
  scripture_text text,                  -- short verse snippet
  category text not null default 'Faith',
  -- Fun quiz distractors (wrong answers for multiple choice)
  distractor_1 text not null default '',
  distractor_2 text not null default '',
  distractor_3 text not null default '',
  emoji text not null default '✝️',     -- visual aid for kids
  difficulty int not null default 1 check (difficulty between 1 and 5),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table biblical_terms enable row level security;
create policy "service_role_all_biblical_terms" on biblical_terms for all using (true);
create policy "anon_read_biblical_terms" on biblical_terms for select using (true);

-- ============================================================
-- BIBLICAL TERMS PROGRESS (tracks mastery per child)
-- ============================================================
create table if not exists biblical_terms_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references child_profiles(id) on delete cascade,
  term_id uuid references biblical_terms(id) on delete cascade,
  mastery_level int not null default 0 check (mastery_level between 0 and 5),
  last_seen_at timestamptz,
  unique(user_id, term_id)
);

alter table biblical_terms_progress enable row level security;
create policy "service_role_all_bible_progress" on biblical_terms_progress for all using (true);

-- ============================================================
-- SEED: Starter Biblical Terms
-- ============================================================
insert into biblical_terms (term, definition, scripture_ref, scripture_text, category, emoji, distractor_1, distractor_2, distractor_3, difficulty, sort_order) values
  ('Grace', 'God''s gift to us that we don''t earn — His love and forgiveness freely given!', 'Ephesians 2:8', 'For it is by grace you have been saved, through faith.', 'Salvation', '🕊️', 'A way to say hello', 'Being very graceful when you dance', 'A fancy type of food', 1, 1),
  ('Faith', 'Believing in God and trusting Him even when we can''t see Him.', 'Hebrews 11:1', 'Faith is confidence in what we hope for and assurance about what we do not see.', 'Foundation', '⭐', 'Being scared of something', 'A type of game to play', 'Feeling very tired', 1, 2),
  ('Prayer', 'Talking to God — like having a conversation with your Heavenly Father!', 'Philippians 4:6', 'In every situation, by prayer and petition, with thanksgiving, present your requests to God.', 'Worship', '🙏', 'Singing a loud song', 'Reading a book quietly', 'Playing outside', 1, 3),
  ('Salvation', 'Being rescued from sin by Jesus — the greatest gift ever!', 'Romans 10:9', 'If you declare with your mouth, "Jesus is Lord," and believe in your heart that God raised him from the dead, you will be saved.', 'Salvation', '✝️', 'Winning a sports game', 'Getting a gold star at school', 'Finding lost keys', 2, 4),
  ('Covenant', 'A special promise between God and His people — like a sacred agreement.', 'Genesis 9:13', 'I have set my rainbow in the clouds, and it will be the sign of the covenant between me and the earth.', 'Promise', '🌈', 'A type of hat', 'A place to swim', 'A kind of vegetable', 2, 5),
  ('Repentance', 'Turning away from doing wrong things and choosing to follow God instead.', '1 John 1:9', 'If we confess our sins, he is faithful and just to forgive us our sins.', 'Salvation', '🔄', 'Running as fast as you can', 'Taking a long nap', 'Eating your vegetables', 2, 6),
  ('Worship', 'Showing love and praise to God through singing, praying, and honoring Him.', 'Psalm 95:6', 'Come, let us bow down in worship, let us kneel before the Lord our Maker.', 'Worship', '🎵', 'Cleaning your room', 'Playing with toys', 'Watching a movie', 1, 7),
  ('Baptism', 'Going under the water as a sign that your old self is gone and you''re new in Jesus!', 'Matthew 28:19', 'Go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.', 'Sacrament', '💧', 'Taking a bath for fun', 'Swimming in the ocean', 'Drinking lots of water', 2, 8),
  ('Disciple', 'A follower and student of Jesus who learns from Him every day.', 'John 8:31', 'If you hold to my teaching, you are really my disciples.', 'Foundation', '👣', 'Someone who makes music', 'A type of soldier', 'A person who cooks food', 2, 9),
  ('Resurrection', 'Jesus rising from the dead on Easter — proving He conquered death for us!', 'John 11:25', 'I am the resurrection and the life. The one who believes in me will live, even though they die.', 'Foundation', '✨', 'Waking up from a nap', 'Going on a vacation', 'Building a snowman', 3, 10),
  ('Gospel', 'The Good News that Jesus came to save us! It means "Good News."', 'Mark 1:15', 'The kingdom of God has come near. Repent and believe the good news!', 'Foundation', '📖', 'A type of music only', 'A newspaper story', 'A very funny joke', 2, 11),
  ('Trinity', 'God is three persons in one: Father, Son (Jesus), and Holy Spirit.', 'Matthew 28:19', 'In the name of the Father and of the Son and of the Holy Spirit.', 'Foundation', '🔱', 'Three friends who live together', 'A triangle shape in math', 'Three different books', 4, 12),
  ('Holy Spirit', 'God''s Spirit living inside believers to guide, comfort, and help them.', 'John 14:26', 'The Holy Spirit will teach you all things and will remind you of everything I have said to you.', 'Foundation', '🕊️', 'A friendly ghost', 'An angel with wings', 'A cloud in the sky', 3, 13),
  ('Mercy', 'When God doesn''t give us the punishment we deserve — He is kind instead!', 'Lamentations 3:22', 'Because of the Lord''s great love we are not consumed, for his compassions never fail.', 'Character of God', '💛', 'Being very strong', 'Getting a reward', 'Winning a competition', 2, 14),
  ('Praise', 'Telling God how wonderful He is with our words, songs, and actions!', 'Psalm 150:6', 'Let everything that has breath praise the Lord.', 'Worship', '🎉', 'Getting a good grade', 'Waving hello to a friend', 'Eating your favorite food', 1, 15),
  ('Scripture', 'The Bible — God''s written Word to us, true and full of wisdom.', '2 Timothy 3:16', 'All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness.', 'Foundation', '📜', 'A really long letter', 'A school textbook', 'A story someone made up', 2, 16),
  ('Atonement', 'Jesus paying for our sins on the cross so we can be forgiven and close to God.', '1 John 2:2', 'He is the atoning sacrifice for our sins, and not only for ours but also for the sins of the whole world.', 'Salvation', '⚖️', 'Saying sorry to a friend', 'Paying a library fine', 'Fixing a broken toy', 4, 17),
  ('Sanctification', 'God''s ongoing work of making us more like Jesus every day.', '1 Thessalonians 4:3', 'It is God''s will that you should be sanctified.', 'Growth', '🌱', 'Getting a haircut', 'Cleaning the house', 'Going back to school', 4, 18),
  ('Prophecy', 'A special message from God, often about the future, spoken through a prophet.', '2 Peter 1:21', 'Prophecy never had its origin in the human will, but prophets spoke from God as they were carried along by the Holy Spirit.', 'Scripture', '🔮', 'Making a guess about tomorrow', 'Telling a fairy tale', 'Reading a fortune cookie', 3, 19),
  ('Redemption', 'Being bought back and set free! Jesus redeemed us from sin.', 'Ephesians 1:7', 'In him we have redemption through his blood, the forgiveness of sins, in accordance with the riches of God''s grace.', 'Salvation', '🗝️', 'Getting a discount at a store', 'Finding a lost toy', 'Returning something to a store', 3, 20)
on conflict do nothing;
