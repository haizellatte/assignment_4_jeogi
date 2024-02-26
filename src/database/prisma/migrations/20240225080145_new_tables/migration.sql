/*
  Warnings:

  - You are about to drop the column `partnerId` on the `Room` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_partnerId_fkey";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "partnerId";
