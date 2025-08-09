/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `guest` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "zen_flow"."Post" DROP COLUMN "imageUrl",
ADD COLUMN     "imageUrls" TEXT[];

-- AlterTable
ALTER TABLE "zen_flow"."User" DROP COLUMN "guest";
