/*
  Warnings:

  - You are about to drop the column `userId` on the `messages` table. All the data in the column will be lost.
  - Added the required column `sessionId` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `messages_userId_idx` ON `messages`;

-- AlterTable
ALTER TABLE `messages` DROP COLUMN `userId`,
    ADD COLUMN `sessionId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `messages_sessionId_idx` ON `messages`(`sessionId`);
