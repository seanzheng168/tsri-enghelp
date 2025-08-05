-- 建立會議記錄表
CREATE TABLE IF NOT EXISTS meeting_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT,
    attendees TEXT[] DEFAULT '{}',
    agenda TEXT,
    content TEXT,
    decisions TEXT,
    action_items TEXT,
    next_meeting TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    email_notifications JSONB DEFAULT '{"enabled": false, "recipients": [], "notifyOnCreate": false, "notifyOnUpdate": false, "reminderBefore": 30}',
    notification_history JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立知識庫文章表
CREATE TABLE IF NOT EXISTS kb_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    images JSONB DEFAULT '[]',
    category TEXT DEFAULT '一般問題',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立 NetApp 指令表
CREATE TABLE IF NOT EXISTS netapp_commands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    command TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Volume',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立 CentOS 指令表
CREATE TABLE IF NOT EXISTS centos_commands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    command TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'System',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立 IP 記錄表
CREATE TABLE IF NOT EXISTS ip_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    category TEXT DEFAULT '伺服器',
    system TEXT DEFAULT 'Linux',
    status TEXT DEFAULT '使用中',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立郵件設定表
CREATE TABLE IF NOT EXISTS email_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    smtp_host TEXT NOT NULL,
    smtp_port INTEGER NOT NULL,
    smtp_user TEXT NOT NULL,
    smtp_password TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立更新時間觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為所有表建立更新時間觸發器
CREATE TRIGGER update_meeting_records_updated_at BEFORE UPDATE ON meeting_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kb_articles_updated_at BEFORE UPDATE ON kb_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_netapp_commands_updated_at BEFORE UPDATE ON netapp_commands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_centos_commands_updated_at BEFORE UPDATE ON centos_commands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ip_records_updated_at BEFORE UPDATE ON ip_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_settings_updated_at BEFORE UPDATE ON email_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_meeting_records_date ON meeting_records(date);
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON kb_articles(category);
CREATE INDEX IF NOT EXISTS idx_netapp_commands_category ON netapp_commands(category);
CREATE INDEX IF NOT EXISTS idx_centos_commands_category ON centos_commands(category);
CREATE INDEX IF NOT EXISTS idx_ip_records_ip_address ON ip_records(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_records_status ON ip_records(status);
