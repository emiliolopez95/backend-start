/*
  Warnings:

  - You are about to drop the column `time` on the `messages` table. All the data in the column will be lost.
  - Added the required column `timestamp` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Made the column `role` on table `messages` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `messages` DROP COLUMN `time`,
    ADD COLUMN `timestamp` INTEGER NOT NULL,
    MODIFY `role` VARCHAR(255) NOT NULL;
