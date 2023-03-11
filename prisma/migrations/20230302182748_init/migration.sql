/*
  Warnings:

  - You are about to drop the column `accountId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `firebaseId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `country` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dob` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `users_accountId_email_key` ON `users`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `accountId`,
    DROP COLUMN `firebaseId`,
    ADD COLUMN `country` VARCHAR(255) NOT NULL,
    ADD COLUMN `dob` VARCHAR(255) NOT NULL,
    ADD COLUMN `gender` VARCHAR(255) NOT NULL,
    ADD COLUMN `subscribed` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `id` INTEGER NOT NULL;

-- DropTable
DROP TABLE `accounts`;

-- CreateTable
CREATE TABLE `sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `time` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL,

    INDEX `sessions_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `time` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,

    INDEX `messages_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
