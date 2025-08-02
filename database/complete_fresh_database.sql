-- สคริปต์ SQL สำหรับสร้างฐานข้อมูลใหม่ทั้งหมด (ลบของเก่าก่อน)
-- Little Secret - Couple Diary Application
-- วันที่: 2025-08-02
-- ลบตารางปัจจุบันทั้งหมดและสร้างใหม่ตามโครงสร้างที่ครบถ้วน

-- =================================================================
-- 0. ลบข้อมูลเก่าทั้งหมด (DANGER: จะลบข้อมูลทั้งหมด!)
-- =================================================================

-- ปิด RLS ก่อนลบตาราง
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS relationships DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS diary_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pomodoro_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS math_problems DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_greetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS neko_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS morning_greetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS couple_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS date_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS love_letters DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mood_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS couple_challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS media_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS photo_albums DISABLE ROW LEVEL SECURITY;

-- ลบ Views ก่อน
DROP VIEW IF EXISTS user_stats CASCADE;

-- ลบ Triggers ก่อน
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_relationships_updated_at ON relationships;
DROP TRIGGER IF EXISTS update_diary_entries_updated_at ON diary_entries;
DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ลบ Functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS handle_new_user();

-- ลบตารางทั้งหมด (ลำดับสำคัญ: ลบตารางที่มี foreign key ก่อน)
DROP TABLE IF EXISTS user_challenges CASCADE;
DROP TABLE IF EXISTS couple_challenges CASCADE;
DROP TABLE IF EXISTS photo_albums CASCADE;
DROP TABLE IF EXISTS media_files CASCADE;
DROP TABLE IF EXISTS mood_tracking CASCADE;
DROP TABLE IF EXISTS love_letters CASCADE;
DROP TABLE IF EXISTS date_plans CASCADE;
DROP TABLE IF EXISTS couple_goals CASCADE;
DROP TABLE IF EXISTS memories CASCADE;
DROP TABLE IF EXISTS morning_greetings CASCADE;
DROP TABLE IF EXISTS user_activity_logs CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS daily_greetings CASCADE;
DROP TABLE IF EXISTS neko_conversations CASCADE;
DROP TABLE IF EXISTS math_problems CASCADE;
DROP TABLE IF EXISTS pomodoro_sessions CASCADE;
DROP TABLE IF EXISTS todos CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS diary_entries CASCADE;
DROP TABLE IF EXISTS relationships CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =================================================================
-- 1. ตารางหลัก (Core Tables)
-- =================================================================

-- 1.1 ตาราง users - ข้อมูลผู้ใช้งาน (หลัก)
CREATE TABLE users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  display_name text,
  nickname text,
  gender text,
  partner_id uuid,
  partner_code text,
  avatar_url text,
  phone text,
  birth_date date,
  relationship_anniversary date,
  bio text,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text])),
  email_verified boolean DEFAULT false,
  is_online boolean DEFAULT false,
  last_seen timestamp with time zone DEFAULT now(),
  timezone text DEFAULT 'Asia/Bangkok'::text,
  language text DEFAULT 'th'::text,
  theme_preference text DEFAULT 'default'::text,
  notification_settings jsonb DEFAULT '{"chat": true, "push": true, "diary": true, "email": true}'::jsonb,
  privacy_settings jsonb DEFAULT '{"diary_default": "shared", "last_seen_visible": true, "profile_visibility": "partner"}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- เพิ่ม foreign key constraint หลังจากสร้างตารางแล้ว
ALTER TABLE users ADD CONSTRAINT users_partner_id_fkey 
  FOREIGN KEY (partner_id) REFERENCES users(id);

-- 1.2 ตาราง relationships - ความสัมพันธ์ระหว่างคู่รัก
CREATE TABLE relationships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL,
  user2_id uuid NOT NULL,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'accepted'::character varying, 'rejected'::character varying, 'active'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT relationships_pkey PRIMARY KEY (id),
  CONSTRAINT relationships_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT relationships_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user1_id, user2_id)
);

-- =================================================================
-- 2. ตารางสำหรับฟีเจอร์หลัก (Main Features)
-- =================================================================

-- 2.1 ตาราง diary_entries - ไดอารี่คู่รัก
CREATE TABLE diary_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title character varying,
  content text NOT NULL,
  mood character varying,
  category character varying DEFAULT 'daily'::character varying,
  visibility character varying DEFAULT 'shared'::character varying CHECK (visibility::text = ANY (ARRAY['private'::character varying, 'shared'::character varying]::text[])),
  image_url text,
  tags text[],
  location jsonb,
  weather jsonb,
  reactions jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT diary_entries_pkey PRIMARY KEY (id),
  CONSTRAINT diary_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2.2 ตาราง chat_messages - ข้อความแชทคู่รัก
CREATE TABLE chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  message text NOT NULL,
  message_type character varying DEFAULT 'text'::character varying CHECK (message_type::text = ANY (ARRAY['text'::character varying, 'emoji'::character varying, 'image'::character varying, 'sticker'::character varying, 'voice'::character varying, 'video'::character varying]::text[])),
  read boolean DEFAULT false,
  reply_to_id uuid,
  reactions jsonb DEFAULT '{}',
  attachments jsonb,
  edited_at timestamp with time zone,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chat_messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chat_messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id) ON DELETE SET NULL
);

-- 2.3 ตาราง todos - รายการสิ่งที่ต้องทำ
CREATE TABLE todos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title character varying NOT NULL,
  description text,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])),
  priority character varying DEFAULT 'normal'::character varying CHECK (priority::text = ANY (ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying]::text[])),
  category character varying DEFAULT 'personal'::character varying,
  due_date timestamp with time zone,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  shared_with_partner boolean DEFAULT false,
  assigned_to_partner boolean DEFAULT false,
  reminder_at timestamp with time zone,
  tags text[],
  attachments jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT todos_pkey PRIMARY KEY (id),
  CONSTRAINT todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =================================================================
-- 3. ตารางสำหรับฟีเจอร์เสริม (Additional Features)
-- =================================================================

-- 3.1 ตาราง pomodoro_sessions - เซสชัน Pomodoro
CREATE TABLE pomodoro_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_name character varying,
  task_description text,
  duration_minutes integer DEFAULT 25,
  session_type character varying DEFAULT 'work'::character varying CHECK (session_type::text = ANY (ARRAY['work'::character varying, 'short_break'::character varying, 'long_break'::character varying, 'long_break_extended'::character varying]::text[])),
  completed boolean DEFAULT false,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  interruptions integer DEFAULT 0,
  focus_rating integer CHECK (focus_rating >= 1 AND focus_rating <= 5),
  productivity_notes text,
  CONSTRAINT pomodoro_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT pomodoro_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3.2 ตาราง math_problems - โจทย์คณิตศาสตร์
CREATE TABLE math_problems (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  problem_type character varying NOT NULL,
  question text NOT NULL,
  correct_answer character varying NOT NULL,
  user_answer character varying,
  is_correct boolean,
  difficulty character varying DEFAULT 'easy'::character varying CHECK (difficulty::text = ANY (ARRAY['easy'::character varying, 'medium'::character varying, 'hard'::character varying, 'expert'::character varying]::text[])),
  solved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  problem_text text,
  time_spent numeric,
  operation character varying,
  hints_used integer DEFAULT 0,
  attempts integer DEFAULT 1,
  explanation text,
  CONSTRAINT math_problems_pkey PRIMARY KEY (id),
  CONSTRAINT math_problems_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =================================================================
-- 4. ตารางสำหรับ AI และความบันเทิง
-- =================================================================

-- 4.1 ตาราง neko_conversations - การสนทนากับ AI เนโกะ
CREATE TABLE neko_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  response text NOT NULL,
  mood character varying DEFAULT 'neutral'::character varying,
  conversation_context jsonb,
  emotion_detected character varying,
  response_type character varying DEFAULT 'text',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT neko_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT neko_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =================================================================
-- 5. ตารางสำหรับการตั้งค่าและข้อมูลผู้ใช้
-- =================================================================

-- 5.1 ตาราง user_preferences - การตั้งค่าผู้ใช้
CREATE TABLE user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  notification_enabled boolean DEFAULT true,
  daily_greeting_enabled boolean DEFAULT true,
  theme character varying DEFAULT 'default'::character varying,
  language character varying DEFAULT 'th'::character varying,
  timezone text DEFAULT 'Asia/Bangkok'::text,
  dark_mode boolean DEFAULT false,
  font_size text DEFAULT 'normal'::text CHECK (font_size = ANY (ARRAY['small'::text, 'normal'::text, 'large'::text, 'extra_large'::text])),
  auto_save boolean DEFAULT true,
  privacy_mode boolean DEFAULT false,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  diary_auto_backup boolean DEFAULT true,
  location_sharing boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5.2 ตาราง user_sessions - เซสชันการใช้งาน
CREATE TABLE user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL,
  device_info jsonb,
  ip_address inet,
  user_agent text,
  last_activity timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5.3 ตาราง user_activity_logs - บันทึกกิจกรรมผู้ใช้
CREATE TABLE user_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  activity_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT user_activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =================================================================
-- 6. ตารางสำหรับคอนเทนต์และการแจ้งเตือน
-- =================================================================

-- 6.1 ตาราง daily_greetings - คำทักทายประจำวัน
CREATE TABLE daily_greetings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  greeting_text text NOT NULL,
  greeting_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_greetings_pkey PRIMARY KEY (id),
  CONSTRAINT daily_greetings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, greeting_date)
);

-- 6.2 ตาราง morning_greetings - ข้อความต้อนรับตอนเช้า (Template)
CREATE TABLE morning_greetings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  message text NOT NULL,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT morning_greetings_pkey PRIMARY KEY (id),
  CONSTRAINT morning_greetings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =================================================================
-- 7. ตารางสำหรับฟีเจอร์อนาคต (Future Features)
-- =================================================================

-- 7.1 ตาราง memories - ความทรงจำพิเศษ
CREATE TABLE memories (
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

-- 7.2 ตาราง couple_goals - เป้าหมายคู่รัก
CREATE TABLE couple_goals (
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

-- 7.3 ตาราง date_plans - แผนเดท
CREATE TABLE date_plans (
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

-- 7.4 ตาราง love_letters - จดหมายรัก
CREATE TABLE love_letters (
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

-- 7.5 ตาราง mood_tracking - ติดตามอารมณ์
CREATE TABLE mood_tracking (
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
  UNIQUE(user_id, tracked_date)
);

-- 7.6 ตาราง couple_challenges - ความท้าทายคู่รัก
CREATE TABLE couple_challenges (
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

-- 7.7 ตาราง user_challenges - การเข้าร่วมความท้าทาย
CREATE TABLE user_challenges (
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

-- =================================================================
-- 8. ตารางสำหรับไฟล์และสื่อ (Media & Files)
-- =================================================================

-- 8.1 ตาราง media_files - ไฟล์สื่อ
CREATE TABLE media_files (
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

-- 8.2 ตาราง photo_albums - อัลบั้มรูปภาพ
CREATE TABLE photo_albums (
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
-- 9. View สำหรับสถิติและรายงาน
-- =================================================================

-- 9.1 View สถิติผู้ใช้
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
-- 10. สร้าง Indexes สำหรับประสิทธิภาพ
-- =================================================================

-- Indexes หลัก
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_partner_code ON users(partner_code);
CREATE INDEX idx_users_partner_id ON users(partner_id);
CREATE INDEX idx_users_is_online ON users(is_online);
CREATE INDEX idx_users_last_seen ON users(last_seen);

-- Indexes สำหรับ diary
CREATE INDEX idx_diary_entries_user_id ON diary_entries(user_id);
CREATE INDEX idx_diary_entries_created_at ON diary_entries(created_at DESC);
CREATE INDEX idx_diary_entries_visibility ON diary_entries(visibility);
CREATE INDEX idx_diary_entries_category ON diary_entries(category);

-- Indexes สำหรับ chat
CREATE INDEX idx_chat_messages_sender_receiver ON chat_messages(sender_id, receiver_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_read ON chat_messages(read);

-- Indexes สำหรับ todos
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_shared_with_partner ON todos(shared_with_partner);

-- Indexes สำหรับ pomodoro
CREATE INDEX idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX idx_pomodoro_sessions_completed ON pomodoro_sessions(completed);
CREATE INDEX idx_pomodoro_sessions_started_at ON pomodoro_sessions(started_at DESC);

-- Indexes สำหรับ math problems
CREATE INDEX idx_math_problems_user_id ON math_problems(user_id);
CREATE INDEX idx_math_problems_difficulty ON math_problems(difficulty);
CREATE INDEX idx_math_problems_is_correct ON math_problems(is_correct);

-- Indexes สำหรับ relationships
CREATE INDEX idx_relationships_users ON relationships(user1_id, user2_id);
CREATE INDEX idx_relationships_status ON relationships(status);

-- Indexes สำหรับ preferences
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Indexes สำหรับ activity logs
CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX idx_user_activity_logs_activity_type ON user_activity_logs(activity_type);

-- Indexes สำหรับตารางอนาคต
CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_memories_partner_id ON memories(partner_id);
CREATE INDEX idx_memories_memory_date ON memories(memory_date);

CREATE INDEX idx_couple_goals_user1_id ON couple_goals(user1_id);
CREATE INDEX idx_couple_goals_user2_id ON couple_goals(user2_id);
CREATE INDEX idx_couple_goals_status ON couple_goals(status);

CREATE INDEX idx_date_plans_planner_id ON date_plans(planner_id);
CREATE INDEX idx_date_plans_partner_id ON date_plans(partner_id);
CREATE INDEX idx_date_plans_planned_date ON date_plans(planned_date);

CREATE INDEX idx_love_letters_sender_id ON love_letters(sender_id);
CREATE INDEX idx_love_letters_receiver_id ON love_letters(receiver_id);
CREATE INDEX idx_love_letters_delivery_date ON love_letters(delivery_date);

CREATE INDEX idx_mood_tracking_user_id ON mood_tracking(user_id);
CREATE INDEX idx_mood_tracking_tracked_date ON mood_tracking(tracked_date);

CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_challenge_id ON user_challenges(challenge_id);
CREATE INDEX idx_user_challenges_status ON user_challenges(status);

CREATE INDEX idx_media_files_user_id ON media_files(user_id);
CREATE INDEX idx_media_files_file_type ON media_files(file_type);

CREATE INDEX idx_photo_albums_user_id ON photo_albums(user_id);
CREATE INDEX idx_photo_albums_partner_id ON photo_albums(partner_id);

-- =================================================================
-- 11. Functions และ Triggers
-- =================================================================

-- Function สำหรับอัปเดต updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers สำหรับอัปเดต timestamp
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at 
    BEFORE UPDATE ON relationships 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diary_entries_updated_at 
    BEFORE UPDATE ON diary_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at 
    BEFORE UPDATE ON todos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

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

-- Function สำหรับสร้าง user profile อัตโนมัติ
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- สร้าง user profile ใน users table
    INSERT INTO users (id, email, username, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- สร้าง user preferences
    INSERT INTO user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger สำหรับสร้าง user profile อัตโนมัติ
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =================================================================
-- 12. Row Level Security (RLS) Policies
-- =================================================================

-- เปิดใช้งาน RLS สำหรับทุกตาราง
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE math_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_greetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE neko_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE morning_greetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE love_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_albums ENABLE ROW LEVEL SECURITY;

-- Policies สำหรับ users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view partner profile" ON users
    FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Policies สำหรับ diary_entries
CREATE POLICY "Users can view own diary entries" ON diary_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view partner's shared diary entries" ON diary_entries
    FOR SELECT USING (
        visibility = 'shared' AND 
        user_id IN (
            SELECT partner_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own diary entries" ON diary_entries
    FOR ALL USING (auth.uid() = user_id);

-- Policies สำหรับ chat_messages
CREATE POLICY "Users can view messages where they are sender or receiver" ON chat_messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages" ON chat_messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Policies สำหรับ todos
CREATE POLICY "Users can manage own todos" ON todos
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Partners can view shared todos" ON todos
    FOR SELECT USING (
        shared_with_partner = true AND 
        user_id IN (
            SELECT partner_id FROM users WHERE id = auth.uid()
        )
    );

-- Policies สำหรับ pomodoro_sessions
CREATE POLICY "Users can manage own pomodoro sessions" ON pomodoro_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Policies สำหรับ math_problems
CREATE POLICY "Users can manage own math problems" ON math_problems
    FOR ALL USING (auth.uid() = user_id);

-- Policies สำหรับ neko_conversations
CREATE POLICY "Users can manage own neko conversations" ON neko_conversations
    FOR ALL USING (auth.uid() = user_id);

-- Policies สำหรับ user_preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Policies สำหรับ user_activity_logs
CREATE POLICY "Users can view own activity logs" ON user_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs" ON user_activity_logs
    FOR INSERT WITH CHECK (true);

-- Policies สำหรับ daily_greetings
CREATE POLICY "Users can manage own daily greetings" ON daily_greetings
    FOR ALL USING (auth.uid() = user_id);

-- Policies สำหรับ morning_greetings
CREATE POLICY "Everyone can view active morning greetings" ON morning_greetings
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own morning greetings" ON morning_greetings
    FOR ALL USING (auth.uid() = user_id);

-- Policies สำหรับตารางอนาคต (Future Features)

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
-- 13. Enable Realtime
-- =================================================================

-- เปิดใช้งาน realtime สำหรับตารางที่ต้องการ
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE diary_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- =================================================================
-- 14. Grant Permissions
-- =================================================================

-- อนุญาตให้ authenticated และ anon users เข้าถึงตาราง
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT SELECT ON user_stats TO authenticated;

-- =================================================================
-- 15. Comments และ Documentation
-- =================================================================

COMMENT ON TABLE users IS 'ข้อมูลผู้ใช้งานระบบ Little Secret';
COMMENT ON TABLE diary_entries IS 'รายการไดอารี่ของผู้ใช้และคู่รัก';
COMMENT ON TABLE chat_messages IS 'ข้อความแชทระหว่างคู่รัก';
COMMENT ON TABLE todos IS 'รายการสิ่งที่ต้องทำ';
COMMENT ON TABLE relationships IS 'ความสัมพันธ์ระหว่างคู่รัก';
COMMENT ON TABLE pomodoro_sessions IS 'เซสชัน Pomodoro สำหรับการจัดการเวลา';
COMMENT ON TABLE math_problems IS 'โจทย์คณิตศาสตร์สำหรับฝึกสมอง';
COMMENT ON TABLE neko_conversations IS 'การสนทนากับ AI Assistant เนโกะ';
COMMENT ON TABLE user_preferences IS 'การตั้งค่าส่วนบุคคลของผู้ใช้';
COMMENT ON TABLE memories IS 'ความทรงจำพิเศษของคู่รัก';
COMMENT ON TABLE couple_goals IS 'เป้าหมายร่วมกันของคู่รัก';
COMMENT ON TABLE date_plans IS 'แผนการเดทและกิจกรรมคู่รัก';
COMMENT ON TABLE love_letters IS 'จดหมายรักระหว่างคู่รัก';
COMMENT ON TABLE mood_tracking IS 'การติดตามอารมณ์ประจำวัน';
COMMENT ON TABLE couple_challenges IS 'ความท้าทายสำหรับคู่รัก';
COMMENT ON TABLE user_challenges IS 'การเข้าร่วมความท้าทายของผู้ใช้';
COMMENT ON TABLE media_files IS 'ไฟล์สื่อและรูปภาพ';
COMMENT ON TABLE photo_albums IS 'อัลบั้มรูปภาพคู่รัก';

COMMENT ON COLUMN diary_entries.mood IS 'อารมณ์: 😊, 😍, 🥰, 😢, 😤, 😴, 🤔, 😎, etc.';
COMMENT ON COLUMN diary_entries.category IS 'หมวดหมู่: daily, love, travel, food, work, other';
COMMENT ON COLUMN diary_entries.visibility IS 'การมองเห็น: private (เฉพาะเจ้าของ), shared (คู่รักเห็นได้ด้วย)';

-- =================================================================
-- 16. Sample Data (Optional) - ข้อมูลตัวอย่างสำหรับการทดสอบ
-- =================================================================

-- เพิ่มข้อมูลตัวอย่าง morning greetings
INSERT INTO morning_greetings (message, category, is_active) VALUES
('สวัสดีตอนเช้า! วันนี้เป็นวันที่สวยงาม ❤️', 'romantic', true),
('ขอให้วันนี้เป็นวันที่ดีสำหรับคุณ 🌸', 'general', true),
('ตื่นมาแล้วก็อย่าลืมยิ้มนะคะ 😊', 'motivational', true),
('วันใหม่ ความรักใหม่ 💕', 'romantic', true),
('ห่วยแล้ว! วันนี้จะเป็นวันที่วิเศษ ✨', 'positive', true);

-- เพิ่มข้อมูลตัวอย่าง couple challenges
INSERT INTO couple_challenges (challenge_name, description, duration_days, difficulty, category, instructions) VALUES
('7 วันแห่งความหวาน', 'ทำสิ่งหวานๆ ให้กันทุกวันเป็นเวลา 7 วัน', 7, 'easy', 'romance', '{"day1": "เขียนโน้ตหวานๆ", "day2": "ทำอาหารให้กัน", "day3": "ส่งรูปเซลฟี่หวานๆ"}'),
('เดินออกกำลังกายร่วมกัน', 'เดินออกกำลังกายร่วมกันเป็นเวลา 14 วัน', 14, 'medium', 'health', '{"target": "เดินวันละ 30 นาที", "goal": "สุขภาพดีร่วมกัน"}'),
('30 วันแห่งความขอบคุณ', 'บอกสิ่งที่ขอบคุณกันทุกวันเป็นเวลา 30 วัน', 30, 'easy', 'gratitude', '{"daily": "เขียนสิ่งที่ขอบคุณ 1 ข้อ", "share": "แชร์ให้กันฟัง"}');

-- สิ้นสุดสคริปต์ฐานข้อมูล Little Secret (Fresh Install)
