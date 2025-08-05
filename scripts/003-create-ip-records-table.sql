-- 建立 IP 記錄表
CREATE TABLE IF NOT EXISTS ip_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    category TEXT DEFAULT '伺服器' CHECK (category IN ('伺服器', '工作站', '網路設備', '印表機', '其他')),
    system TEXT DEFAULT 'Linux' CHECK (system IN ('Windows', 'Linux', 'macOS', '網路設備', '嵌入式系統', '其他')),
    status TEXT DEFAULT '使用中' CHECK (status IN ('使用中', '閒置', '維護中', '已停用')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立更新時間觸發器函數（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為 IP 記錄表建立更新時間觸發器
DROP TRIGGER IF EXISTS update_ip_records_updated_at ON ip_records;
CREATE TRIGGER update_ip_records_updated_at 
    BEFORE UPDATE ON ip_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_ip_records_ip_address ON ip_records(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_records_status ON ip_records(status);
CREATE INDEX IF NOT EXISTS idx_ip_records_category ON ip_records(category);
CREATE INDEX IF NOT EXISTS idx_ip_records_system ON ip_records(system);

-- 插入一些範例資料
INSERT INTO ip_records (ip_address, description, category, system, status) VALUES
('192.168.1.100', '主要檔案伺服器', '伺服器', 'Linux', '使用中'),
('192.168.1.101', '備份伺服器', '伺服器', 'Linux', '使用中'),
('192.168.1.102', '資料庫伺服器', '伺服器', 'Linux', '使用中'),
('192.168.1.200', '管理員工作站', '工作站', 'Windows', '使用中'),
('192.168.1.201', '開發工作站', '工作站', 'Linux', '使用中'),
('192.168.1.1', '主要路由器', '網路設備', '網路設備', '使用中'),
('192.168.1.2', '核心交換器', '網路設備', '網路設備', '使用中'),
('192.168.1.50', '網路印表機', '印表機', '嵌入式系統', '使用中'),
('192.168.1.150', '測試伺服器', '伺服器', 'Linux', '閒置'),
('192.168.1.151', '舊版伺服器', '伺服器', 'Linux', '已停用')
ON CONFLICT (ip_address) DO NOTHING;
