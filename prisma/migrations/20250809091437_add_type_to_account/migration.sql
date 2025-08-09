/*
  Warnings:

  - Added the required column `type` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "zen_flow"."Account" ADD COLUMN     "type" TEXT NOT NULL;
