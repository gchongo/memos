ALTER TABLE memo ADD COLUMN featured INTEGER NOT NULL CHECK (featured IN (0, 1)) DEFAULT 0;

CREATE INDEX idx_memo_featured ON memo(featured);
