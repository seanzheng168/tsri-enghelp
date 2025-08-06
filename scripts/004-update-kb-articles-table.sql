-- 更新知識庫文章表，添加文件支援
ALTER TABLE kb_articles 
ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]';

-- 添加文件相關索引
CREATE INDEX IF NOT EXISTS idx_kb_articles_files ON kb_articles USING GIN (files);

-- 更新現有記錄，確保 files 欄位有預設值
UPDATE kb_articles 
SET files = '[]'::jsonb 
WHERE files IS NULL;
