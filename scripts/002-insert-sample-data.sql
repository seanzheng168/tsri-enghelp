-- 插入範例會議記錄
INSERT INTO meeting_records (title, date, time, location, attendees, agenda, content, decisions, action_items, status) VALUES
('週會討論', '2025-01-20', '14:00', '會議室A', ARRAY['張三', '李四', '王五'], '討論本週工作進度', '本週各項目進度良好', '繼續推進專案開發', '下週同一時間繼續開會', 'completed'),
('專案啟動會議', '2025-01-22', '10:00', '會議室B', ARRAY['專案經理', '開發團隊', '測試團隊'], '專案啟動和分工', '確定專案範圍和時程', '分配各組工作任務', '各組準備詳細計畫', 'completed');

-- 插入範例知識庫文章
INSERT INTO kb_articles (title, content, category, views) VALUES
('登入 EDA Cloud VPN 顯示「無法建立工作階段」', '請確定目前電腦是否使用的實體 IP 網路，並且對應確認設定的IP 位置是否正確。若目前的IP 與實際設定 IP 不同則無法連線成功，如需變更 IP 請至帳號中心或聯絡服務中心。', '登入問題', 156),
('登入EDA Cloud Citrix VPN無法顯示問題', '出現此為當實現Cache的Citrix Workspace會異常，請將當實現的當實員清除；時間範圍建議「不限時間」或「所有時間」，並確認關閉的當實員清除Citrix Workspace所有當前服務與登入資訊。', '連線問題', 89);

-- 插入範例 NetApp 指令
INSERT INTO netapp_commands (title, command, description, category) VALUES
('列出所有 Volume', 'volume show', '顯示目前所有的 volume 資訊', 'Volume'),
('建立 Volume', 'volume create -vserver vs1 -volume vol1 -aggregate aggr1 -size 100G', '建立一個新的 Volume', 'Volume'),
('查看 Aggregate 狀態', 'aggr show', '顯示所有 aggregate 的狀態資訊', 'Aggregate'),
('查看網路介面', 'network interface show', '顯示所有網路介面的設定', 'Network'),
('建立 Snapshot', 'snapshot create -vserver vs1 -volume vol1 -snapshot snap1', '為指定的 volume 建立 snapshot', 'Snapshot');

-- 插入範例 CentOS 指令
INSERT INTO centos_commands (title, command, description, category) VALUES
('查詢 CentOS 版本', 'cat /etc/centos-release', '顯示目前的 CentOS 作業系統版本', 'System'),
('查詢核心版本', 'uname -r', '顯示目前使用的 Linux 核心版本', 'System'),
('查看系統負載', 'top', '即時顯示系統程序和資源使用情況', 'Performance'),
('查看磁碟使用量', 'df -h', '以人類可讀格式顯示檔案系統磁碟使用量', 'Disk'),
('查看網路介面', 'ip addr show', '顯示所有網路介面的IP位址資訊', 'Network');

-- 插入範例 IP 記錄
INSERT INTO ip_records (ip_address, description, category, system, status) VALUES
('192.168.1.100', '主要檔案伺服器', '伺服器', 'Linux', '使用中'),
('192.168.1.101', '開發環境伺服器', '伺服器', 'Linux', '使用中'),
('192.168.1.50', '網路印表機 - 辦公室', '印表機', '嵌入式系統', '使用中');
