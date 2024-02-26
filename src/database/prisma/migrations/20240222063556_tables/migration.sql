/*
  Warnings:

  - You are about to drop the column `lable` on the `Regions` table. All the data in the column will be lost.
  - Added the required column `label` to the `Regions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Regions" DROP COLUMN "lable",
ADD COLUMN     "label" TEXT NOT NULL;
