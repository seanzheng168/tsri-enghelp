-- 創建IP記錄表
CREATE TABLE IF NOT EXISTS ip_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL,
    hostname VARCHAR(255),
    description TEXT,
    location VARCHAR(255),
    department VARCHAR(100),
    contact_person VARCHAR(100),
    contact_email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'reserved', 'maintenance')),
    ip_type VARCHAR(10) DEFAULT 'ipv4' CHECK (ip_type IN ('ipv4', 'ipv6')),
    subnet_mask VARCHAR(20),
    gateway VARCHAR(45),
    dns_servers TEXT[] DEFAULT '{}',
    vlan_id INTEGER,
    mac_address VARCHAR(17),
    device_type VARCHAR(50),
    os_version VARCHAR(100),
    last_ping TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ip_address)
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_ip_records_ip_address ON ip_records(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_records_hostname ON ip_records(hostname);
CREATE INDEX IF NOT EXISTS idx_ip_records_status ON ip_records(status);
CREATE INDEX IF NOT EXISTS idx_ip_records_department ON ip_records(department);
CREATE INDEX IF NOT EXISTS idx_ip_records_device_type ON ip_records(device_type);

-- 創建更新時間觸發器
CREATE TRIGGER update_ip_records_updated_at 
    BEFORE UPDATE ON ip_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 插入範例IP記錄資料
INSERT INTO ip_records (
    ip_address, hostname, description, location, department, 
    contact_person, contact_email, status, ip_type, subnet_mask, 
    gateway, dns_servers, device_type, os_version, notes, created_by
) VALUES
('192.168.1.10', 'server01.tsri.local', 'Web伺服器', '機房A', 'IT部門', 
 '張工程師', 'zhang@tsri.org.tw', 'active', 'ipv4', '255.255.255.0', 
 '192.168.1.1', ARRAY['8.8.8.8', '8.8.4.4'], 'Server', 'CentOS 8', 
 '主要Web服務伺服器', (SELECT id FROM users WHERE username = 'admin')),

('192.168.1.20', 'db01.tsri.local', '資料庫伺服器', '機房A', 'IT部門', 
 '李工程師', 'li@tsri.org.tw', 'active', 'ipv4', '255.255.255.0', 
 '192.168.1.1', ARRAY['8.8.8.8', '8.8.4.4'], 'Server', 'CentOS 8', 
 'PostgreSQL資料庫伺服器', (SELECT id FROM users WHERE username = 'admin')),

('192.168.2.100', 'workstation01', '工程師工作站', '辦公室B', '研發部門', 
 '王工程師', 'wang@tsri.org.tw', 'active', 'ipv4', '255.255.255.0', 
 '192.168.2.1', ARRAY['192.168.1.20'], 'Workstation', 'Windows 11', 
 'EDA工具專用工作站', (SELECT id FROM users WHERE username = 'editor1')),

('10.0.1.50', 'nas01.tsri.local', '網路儲存設備', '機房B', 'IT部門', 
 '陳工程師', 'chen@tsri.org.tw', 'active', 'ipv4', '255.255.255.0', 
 '10.0.1.1', ARRAY['8.8.8.8'], 'NAS', 'NetApp ONTAP', 
 '主要檔案儲存系統', (SELECT id FROM users WHERE username = 'admin')),

('192.168.3.200', 'printer01', '網路印表機', '辦公室A', '行政部門', 
 '林助理', 'lin@tsri.org.tw', 'active', 'ipv4', '255.255.255.0', 
 '192.168.3.1', ARRAY['192.168.1.20'], 'Printer', 'HP LaserJet', 
 '彩色雷射印表機', (SELECT id FROM users WHERE username = 'user1'))
ON CONFLICT (ip_address) DO NOTHING;
