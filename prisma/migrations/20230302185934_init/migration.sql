/*
  Warnings:

  - You are about to drop the column `time` on the `sessions` table. All the data in the column will be lost.
  - Added the required column `content` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `messages` ADD COLUMN `content` VARCHAR(191) NOT NULL,
    ADD COLUMN `role` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `sessions` DROP COLUMN `time`,
    MODIFY `isActive` BOOLEAN NOT NULL DEFAULT true;
