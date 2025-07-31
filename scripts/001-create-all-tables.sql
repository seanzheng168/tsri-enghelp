-- 創建用戶表
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'user')),
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- 創建知識庫文章表
CREATE TABLE IF NOT EXISTS articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    author_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_published BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0
);

-- 創建NetApp指令表
CREATE TABLE IF NOT EXISTS netapp_commands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    command VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    example TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0
);

-- 創建CentOS指令表
CREATE TABLE IF NOT EXISTS centos_commands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    command VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    example TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0
);

-- 創建會議紀錄表
CREATE TABLE IF NOT EXISTS meeting_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    organizer_id UUID REFERENCES users(id),
    attendees TEXT[] DEFAULT '{}',
    agenda TEXT,
    minutes TEXT,
    action_items TEXT,
    attachments TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建工具使用統計表
CREATE TABLE IF NOT EXISTS tool_usage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_name VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id),
    usage_date DATE DEFAULT CURRENT_DATE,
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tool_name, user_id, usage_date)
);

-- 創建系統設定表
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_netapp_commands_category ON netapp_commands(category);
CREATE INDEX IF NOT EXISTS idx_centos_commands_category ON centos_commands(category);
CREATE INDEX IF NOT EXISTS idx_meeting_records_date ON meeting_records(date);
CREATE INDEX IF NOT EXISTS idx_meeting_records_organizer ON meeting_records(organizer_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_stats_tool ON tool_usage_stats(tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_usage_stats_user ON tool_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_stats_date ON tool_usage_stats(usage_date);

-- 創建更新時間觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為需要的表創建更新時間觸發器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_netapp_commands_updated_at BEFORE UPDATE ON netapp_commands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_centos_commands_updated_at BEFORE UPDATE ON centos_commands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_records_updated_at BEFORE UPDATE ON meeting_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
