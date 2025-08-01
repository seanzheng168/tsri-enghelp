-- 插入範例會議紀錄
INSERT INTO meeting_records (
    title, date, time, location, attendees, agenda, content, decisions, action_items, 
    next_meeting, status, email_notifications, notification_history
) VALUES (
    '週例會 - 專案進度檢討',
    '2025-01-22',
    '14:00',
    '會議室A',
    '["張經理", "李工程師", "王設計師", "陳分析師"]'::jsonb,
    '1. 上週工作回顧
2. 本週工作計劃
3. 專案進度討論
4. 問題與解決方案',
    '會議開始時間：14:00

1. 上週工作回顧：
- 完成了用戶介面設計
- 後端API開發進度80%
- 測試環境搭建完成

2. 本週工作計劃：
- 完成後端API開發
- 開始前端整合測試
- 準備用戶驗收測試',
    '1. 確定下週進行用戶驗收測試
2. 增加一名測試工程師支援
3. 調整專案時程，延後一週上線',
    '1. 李工程師：完成剩餘API開發 (1/25前)
2. 王設計師：準備測試用例 (1/24前)
3. 陳分析師：聯繫測試工程師 (1/23前)',
    '2025-01-29 14:00',
    'completed',
    '{
        "enabled": true,
        "recipients": ["manager@tsri.org.tw", "engineer@tsri.org.tw"],
        "notifyOnCreate": true,
        "notifyOnUpdate": true,
        "reminderBefore": 30
    }'::jsonb,
    '[{
        "id": "n1",
        "type": "meeting_created",
        "sentAt": "2025-01-22 09:00",
        "recipients": ["manager@tsri.org.tw", "engineer@tsri.org.tw"],
        "status": "sent",
        "subject": "新會議通知：週例會 - 專案進度檢討"
    }]'::jsonb
),
(
    '系統架構討論會議',
    '2025-01-25',
    '10:00',
    '線上會議',
    '["技術總監", "資深工程師", "系統架構師"]'::jsonb,
    '1. 新系統架構設計
2. 技術選型討論
3. 效能評估
4. 安全性考量',
    '討論新系統的整體架構設計，包括微服務架構的採用、資料庫選型、快取策略等技術議題。',
    '1. 採用微服務架構
2. 使用PostgreSQL作為主資料庫
3. Redis作為快取解決方案',
    '1. 準備技術選型文件
2. 建立開發環境
3. 制定編碼規範',
    '',
    'scheduled',
    '{
        "enabled": false,
        "recipients": [],
        "notifyOnCreate": false,
        "notifyOnUpdate": false,
        "reminderBefore": 15
    }'::jsonb,
    '[]'::jsonb
);

-- 插入預設郵件設定
INSERT INTO email_settings (smtp_host, smtp_port, smtp_user, smtp_password, sender_email, sender_name)
VALUES ('smtp.gmail.com', 587, '', '', 'noreply@tsri.org.tw', 'TSRI 會議系統')
ON CONFLICT DO NOTHING;
