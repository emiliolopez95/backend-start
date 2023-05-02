-- DropIndex
DROP INDEX `sessions_userId_idx` ON `sessions`;

-- CreateIndex
CREATE INDEX `sessions_userId_isActive_idx` ON `sessions`(`userId`, `isActive`);
