/*
  Warnings:

  - You are about to drop the `Image` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "zen_flow"."Image" DROP CONSTRAINT "Image_postId_fkey";

-- AlterTable
ALTER TABLE "zen_flow"."Post" ADD COLUMN     "imageUrl" TEXT;

-- DropTable
DROP TABLE "zen_flow"."Image";
