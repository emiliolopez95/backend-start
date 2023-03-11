/*
  Warnings:

  - You are about to alter the column `role` on the `messages` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `Enum("messages_role")`.

*/
-- DropIndex
DROP INDEX `messages_sessionId_idx` ON `messages`;

-- AlterTable
ALTER TABLE `messages` MODIFY `role` ENUM('user', 'system', 'assistant') NOT NULL;

-- CreateIndex
CREATE INDEX `messages_sessionId_createdAt_idx` ON `messages`(`sessionId`, `createdAt`);
