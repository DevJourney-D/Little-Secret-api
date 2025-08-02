-- สคริปต์ Migration สำหรับเพิ่มตารางและคอลัมน์ใหม่ (ไม่ลบข้อมูลเดิม)
-- Little Secret - Safe Migration Script
-- วันที่: 2025-08-02
-- สำหรับอัปเดตฐานข้อมูลที่มีข้อมูลอยู่แล้ว

-- =================================================================
-- 1. เพิ่มคอลัมน์ที่ขาดหายไปในตารางที่มีอยู่
-- =================================================================

-- เพิ่มคอลัมน์ในตาราง users (ถ้ายังไม่มี)
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_code text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS relationship_anniversary date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Asia/Bangkok'::text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS language text DEFAULT 'th'::text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'default'::text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{"chat": true, "push": true, "diary": true, "email": true}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{"diary_default": "shared", "last_seen_visible": true, "profile_visibility": "partner"}'::jsonb;

-- เพิ่มคอลัมน์ในตาราง diary_entries
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS location jsonb;
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS weather jsonb;
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}';

-- เพิ่มคอลัมน์ในตาราง chat_messages
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to_id uuid;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachments jsonb;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- เพิ่มคอลัมน์ในตาราง todos
ALTER TABLE todos ADD COLUMN IF NOT EXISTS assigned_to_partner boolean DEFAULT false;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS reminder_at timestamp with time zone;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE todos ADD COLUMN IF NOT EXISTS attachments jsonb;

-- เพิ่มคอลัมน์ในตาราง pomodoro_sessions
ALTER TABLE pomodoro_sessions ADD COLUMN IF NOT EXISTS task_description text;
ALTER TABLE pomodoro_sessions ADD COLUMN IF NOT EXISTS interruptions integer DEFAULT 0;
ALTER TABLE pomodoro_sessions ADD COLUMN IF NOT EXISTS focus_rating integer CHECK (focus_rating >= 1 AND focus_rating <= 5);
ALTER TABLE pomodoro_sessions ADD COLUMN IF NOT EXISTS productivity_notes text;

-- เพิ่มคอลัมน์ในตาราง math_problems
ALTER TABLE math_problems ADD COLUMN IF NOT EXISTS hints_used integer DEFAULT 0;
ALTER TABLE math_problems ADD COLUMN IF NOT EXISTS attempts integer DEFAULT 1;
ALTER TABLE math_problems ADD COLUMN IF NOT EXISTS explanation text;

-- เพิ่มคอลัมน์ในตาราง neko_conversations
ALTER TABLE neko_conversations ADD COLUMN IF NOT EXISTS conversation_context jsonb;
ALTER TABLE neko_conversations ADD COLUMN IF NOT EXISTS emotion_detected character varying;
ALTER TABLE neko_conversations ADD COLUMN IF NOT EXISTS response_type character varying DEFAULT 'text';

-- เพิ่มคอลัมน์ในตาราง user_preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS push_notifications boolean DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS diary_auto_backup boolean DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS location_sharing boolean DEFAULT false;

-- =================================================================
-- 2. สร้างตารางใหม่ที่ยังไม่มี (Future Features)
-- =================================================================

-- 2.1 ตาราง memories
CREATE TABLE IF NOT EXISTS memories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  partner_id uuid,
  title character varying NOT NULL,
  description text,
  memory_date date,
  location jsonb,
  photos text[],
  tags text[],
  mood character varying,
  is_special boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT memories_pkey PRIMARY KEY (id),
  CONSTRAINT memories_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT memories_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 2.2 ตาราง couple_goals
CREATE TABLE IF NOT EXISTS couple_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL,
  user2_id uuid NOT NULL,
  title character varying NOT NULL,
  description text,
  category character varying DEFAULT 'general',
  target_date date,
  status character varying DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  milestones jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT couple_goals_pkey PRIMARY KEY (id),
  CONSTRAINT couple_goals_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT couple_goals_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2.3 ตาราง date_plans
CREATE TABLE IF NOT EXISTS date_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  planner_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  title character varying NOT NULL,
  description text,
  planned_date timestamp with time zone,
  location jsonb,
  budget_estimate numeric,
  status character varying DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'completed', 'cancelled')),
  activities jsonb DEFAULT '[]',
  notes text,
  photos text[],
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT date_plans_pkey PRIMARY KEY (id),
  CONSTRAINT date_plans_planner_id_fkey FOREIGN KEY (planner_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT date_plans_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2.4 ตาราง love_letters
CREATE TABLE IF NOT EXISTS love_letters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  title character varying,
  content text NOT NULL,
  delivery_date timestamp with time zone,
  is_scheduled boolean DEFAULT false,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  template_id uuid,
  mood character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT love_letters_pkey PRIMARY KEY (id),
  CONSTRAINT love_letters_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT love_letters_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2.5 ตาราง mood_tracking
CREATE TABLE IF NOT EXISTS mood_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mood_level integer CHECK (mood_level >= 1 AND mood_level <= 10),
  mood_type character varying,
  emotions text[],
  notes text,
  triggers text[],
  activities text[],
  weather jsonb,
  tracked_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mood_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT mood_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT mood_tracking_unique_user_date UNIQUE(user_id, tracked_date)
);

-- 2.6 ตาราง couple_challenges
CREATE TABLE IF NOT EXISTS couple_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  challenge_name character varying NOT NULL,
  description text,
  duration_days integer DEFAULT 7,
  difficulty character varying DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category character varying DEFAULT 'general',
  instructions jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT couple_challenges_pkey PRIMARY KEY (id)
);

-- 2.7 ตาราง user_challenges
CREATE TABLE IF NOT EXISTS user_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  challenge_id uuid NOT NULL,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  status character varying DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'abandoned')),
  progress jsonb DEFAULT '{}',
  notes text,
  CONSTRAINT user_challenges_pkey PRIMARY KEY (id),
  CONSTRAINT user_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_challenges_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_challenges_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES couple_challenges(id) ON DELETE CASCADE
);

-- 2.8 ตาราง media_files
CREATE TABLE IF NOT EXISTS media_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  filename character varying NOT NULL,
  original_filename character varying,
  file_type character varying NOT NULL,
  file_size bigint,
  storage_path text NOT NULL,
  public_url text,
  alt_text text,
  tags text[],
  is_shared_with_partner boolean DEFAULT false,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT media_files_pkey PRIMARY KEY (id),
  CONSTRAINT media_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2.9 ตาราง photo_albums
CREATE TABLE IF NOT EXISTS photo_albums (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  partner_id uuid,
  name character varying NOT NULL,
  description text,
  cover_photo_id uuid,
  is_collaborative boolean DEFAULT false,
  privacy_level character varying DEFAULT 'private' CHECK (privacy_level IN ('private', 'partner_only', 'shared')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT photo_albums_pkey PRIMARY KEY (id),
  CONSTRAINT photo_albums_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT photo_albums_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT photo_albums_cover_photo_id_fkey FOREIGN KEY (cover_photo_id) REFERENCES media_files(id) ON DELETE SET NULL
);

-- =================================================================
-- 3. อัปเดต/สร้าง View ใหม่
-- =================================================================

-- ลบ View เก่า
DROP VIEW IF EXISTS user_stats;

-- สร้าง View ใหม่
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.display_name,
    u.partner_id,
    COUNT(DISTINCT d.id) as diary_count,
    COUNT(DISTINCT CASE WHEN t.completed = false THEN t.id END) as pending_todos,
    COUNT(DISTINCT CASE WHEN t.completed = true THEN t.id END) as completed_todos,
    COUNT(DISTINCT p.id) as pomodoro_sessions,
    COUNT(DISTINCT CASE WHEN m.is_correct = true THEN m.id END) as correct_math_problems,
    COUNT(DISTINCT cm.id) as total_messages_sent,
    COUNT(DISTINCT nc.id) as neko_conversations_count,
    AVG(CASE WHEN m.time_spent IS NOT NULL THEN m.time_spent END) as avg_math_time
FROM users u
LEFT JOIN diary_entries d ON u.id = d.user_id
LEFT JOIN todos t ON u.id = t.user_id
LEFT JOIN pomodoro_sessions p ON u.id = p.user_id AND p.completed = true
LEFT JOIN math_problems m ON u.id = m.user_id
LEFT JOIN chat_messages cm ON u.id = cm.sender_id
LEFT JOIN neko_conversations nc ON u.id = nc.user_id
GROUP BY u.id, u.first_name, u.last_name, u.display_name, u.partner_id;

-- =================================================================
-- 4. เพิ่ม Indexes ใหม่
-- =================================================================

-- Indexes สำหรับคอลัมน์ใหม่
CREATE INDEX IF NOT EXISTS idx_users_partner_code ON users(partner_code);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);

-- Indexes สำหรับตารางใหม่
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_partner_id ON memories(partner_id);
CREATE INDEX IF NOT EXISTS idx_memories_memory_date ON memories(memory_date);

CREATE INDEX IF NOT EXISTS idx_couple_goals_user1_id ON couple_goals(user1_id);
CREATE INDEX IF NOT EXISTS idx_couple_goals_user2_id ON couple_goals(user2_id);
CREATE INDEX IF NOT EXISTS idx_couple_goals_status ON couple_goals(status);

CREATE INDEX IF NOT EXISTS idx_date_plans_planner_id ON date_plans(planner_id);
CREATE INDEX IF NOT EXISTS idx_date_plans_partner_id ON date_plans(partner_id);
CREATE INDEX IF NOT EXISTS idx_date_plans_planned_date ON date_plans(planned_date);

CREATE INDEX IF NOT EXISTS idx_love_letters_sender_id ON love_letters(sender_id);
CREATE INDEX IF NOT EXISTS idx_love_letters_receiver_id ON love_letters(receiver_id);
CREATE INDEX IF NOT EXISTS idx_love_letters_delivery_date ON love_letters(delivery_date);

CREATE INDEX IF NOT EXISTS idx_mood_tracking_user_id ON mood_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_tracking_tracked_date ON mood_tracking(tracked_date);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge_id ON user_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status);

CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_file_type ON media_files(file_type);

CREATE INDEX IF NOT EXISTS idx_photo_albums_user_id ON photo_albums(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_albums_partner_id ON photo_albums(partner_id);

-- =================================================================
-- 5. เพิ่ม Foreign Key Constraints ที่ขาดหายไป
-- =================================================================

-- เพิ่ม Foreign Key สำหรับ chat_messages.reply_to_id ถ้ายังไม่มี
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_messages_reply_to_id_fkey'
    ) THEN
        ALTER TABLE chat_messages 
        ADD CONSTRAINT chat_messages_reply_to_id_fkey 
        FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =================================================================
-- 6. เพิ่ม/อัปเดต Triggers สำหรับตารางใหม่
-- =================================================================

-- สร้าง Triggers สำหรับ updated_at ในตารางใหม่
CREATE TRIGGER update_memories_updated_at 
    BEFORE UPDATE ON memories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_couple_goals_updated_at 
    BEFORE UPDATE ON couple_goals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_date_plans_updated_at 
    BEFORE UPDATE ON date_plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photo_albums_updated_at 
    BEFORE UPDATE ON photo_albums 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- 7. เปิดใช้งาน RLS สำหรับตารางใหม่
-- =================================================================

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE love_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_albums ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- 8. เพิ่ม RLS Policies สำหรับตารางใหม่
-- =================================================================

-- Policies สำหรับ memories
CREATE POLICY "Users can manage own memories" ON memories
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Partners can view shared memories" ON memories
    FOR SELECT USING (auth.uid() = partner_id);

-- Policies สำหรับ couple_goals
CREATE POLICY "Users can manage goals they participate in" ON couple_goals
    FOR ALL USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Policies สำหรับ date_plans
CREATE POLICY "Users can manage date plans they participate in" ON date_plans
    FOR ALL USING (auth.uid() = planner_id OR auth.uid() = partner_id);

-- Policies สำหรับ love_letters
CREATE POLICY "Users can manage letters they send or receive" ON love_letters
    FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policies สำหรับ mood_tracking
CREATE POLICY "Users can manage own mood tracking" ON mood_tracking
    FOR ALL USING (auth.uid() = user_id);

-- Policies สำหรับ couple_challenges
CREATE POLICY "Everyone can view active challenges" ON couple_challenges
    FOR SELECT USING (is_active = true);

-- Policies สำหรับ user_challenges
CREATE POLICY "Users can manage challenges they participate in" ON user_challenges
    FOR ALL USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- Policies สำหรับ media_files
CREATE POLICY "Users can manage own media files" ON media_files
    FOR ALL USING (auth.uid() = user_id);

-- Policies สำหรับ photo_albums
CREATE POLICY "Users can manage own photo albums" ON photo_albums
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Partners can view collaborative albums" ON photo_albums
    FOR SELECT USING (auth.uid() = partner_id AND is_collaborative = true);

-- =================================================================
-- 9. Grant Permissions
-- =================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT SELECT ON user_stats TO authenticated;

-- =================================================================
-- 10. เพิ่มข้อมูลตัวอย่างสำหรับตารางใหม่ (ถ้ายังไม่มี)
-- =================================================================

-- เพิ่ม morning greetings ถ้ายังไม่มี
INSERT INTO morning_greetings (message, category, is_active) 
SELECT 'สวัสดีตอนเช้า! วันนี้เป็นวันที่สวยงาม ❤️', 'romantic', true
WHERE NOT EXISTS (SELECT 1 FROM morning_greetings WHERE message = 'สวัสดีตอนเช้า! วันนี้เป็นวันที่สวยงาม ❤️');

INSERT INTO morning_greetings (message, category, is_active) 
SELECT 'ขอให้วันนี้เป็นวันที่ดีสำหรับคุณ 🌸', 'general', true
WHERE NOT EXISTS (SELECT 1 FROM morning_greetings WHERE message = 'ขอให้วันนี้เป็นวันที่ดีสำหรับคุณ 🌸');

INSERT INTO morning_greetings (message, category, is_active) 
SELECT 'ตื่นมาแล้วก็อย่าลืมยิ้มนะคะ 😊', 'motivational', true
WHERE NOT EXISTS (SELECT 1 FROM morning_greetings WHERE message = 'ตื่นมาแล้วก็อย่าลืมยิ้มนะคะ 😊');

-- เพิ่ม couple challenges ถ้ายังไม่มี
INSERT INTO couple_challenges (challenge_name, description, duration_days, difficulty, category, instructions) 
SELECT '7 วันแห่งความหวาน', 'ทำสิ่งหวานๆ ให้กันทุกวันเป็นเวลา 7 วัน', 7, 'easy', 'romance', '{"day1": "เขียนโน้ตหวานๆ", "day2": "ทำอาหารให้กัน", "day3": "ส่งรูปเซลฟี่หวานๆ"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM couple_challenges WHERE challenge_name = '7 วันแห่งความหวาน');

INSERT INTO couple_challenges (challenge_name, description, duration_days, difficulty, category, instructions) 
SELECT 'เดินออกกำลังกายร่วมกัน', 'เดินออกกำลังกายร่วมกันเป็นเวลา 14 วัน', 14, 'medium', 'health', '{"target": "เดินวันละ 30 นาที", "goal": "สุขภาพดีร่วมกัน"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM couple_challenges WHERE challenge_name = 'เดินออกกำลังกายร่วมกัน');

-- =================================================================
-- 11. Comments
-- =================================================================

COMMENT ON TABLE memories IS 'ความทรงจำพิเศษของคู่รัก';
COMMENT ON TABLE couple_goals IS 'เป้าหมายร่วมกันของคู่รัก';
COMMENT ON TABLE date_plans IS 'แผนการเดทและกิจกรรมคู่รัก';
COMMENT ON TABLE love_letters IS 'จดหมายรักระหว่างคู่รัก';
COMMENT ON TABLE mood_tracking IS 'การติดตามอารมณ์ประจำวัน';
COMMENT ON TABLE couple_challenges IS 'ความท้าทายสำหรับคู่รัก';
COMMENT ON TABLE user_challenges IS 'การเข้าร่วมความท้าทายของผู้ใช้';
COMMENT ON TABLE media_files IS 'ไฟล์สื่อและรูปภาพ';
COMMENT ON TABLE photo_albums IS 'อัลบั้มรูปภาพคู่รัก';

-- Migration สำเร็จ!
SELECT 'Migration completed successfully!' as status;
