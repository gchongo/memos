ALTER TABLE `memo` ADD COLUMN `featured` BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_memo_featured ON `memo`(`featured`);
