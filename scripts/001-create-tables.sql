-- 建立會議紀錄資料表
CREATE TABLE IF NOT EXISTS meeting_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT,
    attendees JSONB DEFAULT '[]'::jsonb,
    agenda TEXT,
    content TEXT,
    decisions TEXT,
    action_items TEXT,
    next_meeting TEXT,
    status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
    email_notifications JSONB DEFAULT '{
        "enabled": false,
        "recipients": [],
        "notifyOnCreate": true,
        "notifyOnUpdate": true,
        "reminderBefore": 30
    }'::jsonb,
    notification_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立郵件設定資料表
CREATE TABLE IF NOT EXISTS email_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    smtp_host TEXT DEFAULT 'smtp.gmail.com',
    smtp_port INTEGER DEFAULT 587,
    smtp_user TEXT,
    smtp_password TEXT,
    sender_email TEXT DEFAULT 'noreply@tsri.org.tw',
    sender_name TEXT DEFAULT 'TSRI 會議系統',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立更新時間的觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為會議紀錄表建立觸發器
CREATE TRIGGER update_meeting_records_updated_at 
    BEFORE UPDATE ON meeting_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 為郵件設定表建立觸發器
CREATE TRIGGER update_email_settings_updated_at 
    BEFORE UPDATE ON email_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_meeting_records_date ON meeting_records(date);
CREATE INDEX IF NOT EXISTS idx_meeting_records_status ON meeting_records(status);
CREATE INDEX IF NOT EXISTS idx_meeting_records_created_at ON meeting_records(created_at);
