/*
  Warnings:

  - A unique constraint covering the columns `[whatsAppId,companyId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `users_whatsAppId_companyId_key` ON `users`(`whatsAppId`, `companyId`);
