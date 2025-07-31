-- 插入範例用戶資料
INSERT INTO users (username, email, password_hash, role, permissions) VALUES
('admin', 'admin@tsri.org.tw', '$2b$10$example_hash_for_admin', 'admin', ARRAY['all']),
('editor1', 'editor1@tsri.org.tw', '$2b$10$example_hash_for_editor1', 'editor', ARRAY['knowledge-base', 'netapp-commands', 'centos-commands', 'meeting-records']),
('user1', 'user1@tsri.org.tw', '$2b$10$example_hash_for_user1', 'user', ARRAY['password-generator', 'ip-lookup', 'netapp-commands', 'centos-commands'])
ON CONFLICT (username) DO NOTHING;

-- 插入範例知識庫文章
INSERT INTO articles (title, content, category, tags, author_id, is_published) VALUES
('EDA Cloud 使用指南', '# EDA Cloud 使用指南

## 簡介
EDA Cloud 是我們的雲端電子設計自動化平台...

## 主要功能
1. 設計工具整合
2. 雲端運算資源
3. 協作功能

## 使用步驟
1. 登入系統
2. 選擇工具
3. 上傳設計檔案
4. 執行模擬', 'EDA', ARRAY['cloud', 'eda', 'guide'], (SELECT id FROM users WHERE username = 'admin'), true),

('半導體製程基礎', '# 半導體製程基礎

## 製程流程
半導體製程包含多個步驟...

## 關鍵技術
- 光刻技術
- 蝕刻技術
- 薄膜沉積', '製程', ARRAY['semiconductor', 'process', 'basics'], (SELECT id FROM users WHERE username = 'editor1'), true)
ON CONFLICT DO NOTHING;

-- 插入範例NetApp指令
INSERT INTO netapp_commands (command, description, category, example, notes) VALUES
('vol show', '顯示所有磁碟區資訊', '磁碟區管理', 'vol show -vserver vs1', '可以加上 -vserver 參數指定特定的 SVM'),
('aggr show', '顯示所有聚合資訊', '聚合管理', 'aggr show -aggregate aggr1', '用於查看聚合的狀態和容量'),
('network interface show', '顯示網路介面資訊', '網路管理', 'network interface show -vserver vs1', '查看邏輯介面的配置'),
('snapshot create', '建立快照', '快照管理', 'snapshot create -vserver vs1 -volume vol1 -snapshot snap1', '建立磁碟區的時間點快照'),
('lun show', '顯示LUN資訊', 'SAN管理', 'lun show -vserver vs1', '查看所有LUN的狀態和配置')
ON CONFLICT DO NOTHING;

-- 插入範例CentOS指令
INSERT INTO centos_commands (command, description, category, example, notes) VALUES
('systemctl status', '查看服務狀態', '系統服務', 'systemctl status httpd', '查看特定服務的運行狀態'),
('firewall-cmd --list-all', '查看防火牆規則', '防火牆管理', 'firewall-cmd --zone=public --list-all', '顯示指定區域的所有規則'),
('df -h', '查看磁碟使用情況', '磁碟管理', 'df -h /home', '以人類可讀格式顯示磁碟使用量'),
('top', '查看系統進程', '系統監控', 'top -u username', '即時顯示系統進程資訊'),
('yum update', '更新系統套件', '套件管理', 'yum update -y', '更新所有已安裝的套件')
ON CONFLICT DO NOTHING;

-- 插入範例會議紀錄
INSERT INTO meeting_records (title, date, start_time, end_time, location, organizer_id, attendees, agenda, minutes, status) VALUES
('每週技術會議', '2025-01-31', '09:00', '10:00', '會議室A', 
 (SELECT id FROM users WHERE username = 'admin'), 
 ARRAY['張工程師', '李工程師', '王工程師'],
 '1. 專案進度報告\n2. 技術問題討論\n3. 下週工作安排',
 '會議討論了當前專案的進展情況，確認了下週的工作重點。',
 'completed'),

('EDA工具培訓', '2025-02-05', '14:00', '16:00', '訓練教室', 
 (SELECT id FROM users WHERE username = 'editor1'), 
 ARRAY['新進工程師A', '新進工程師B'],
 '1. EDA工具介紹\n2. 實作練習\n3. Q&A',
 '進行了EDA工具的基礎培訓，參與者反應良好。',
 'scheduled')
ON CONFLICT DO NOTHING;

-- 插入系統設定
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('site_title', 'TSRI 工程師小幫手', '網站標題'),
('max_file_size', '10485760', '最大檔案上傳大小 (bytes)'),
('session_timeout', '3600', '會話超時時間 (秒)'),
('enable_registration', 'false', '是否允許用戶註冊')
ON CONFLICT (setting_key) DO NOTHING;
