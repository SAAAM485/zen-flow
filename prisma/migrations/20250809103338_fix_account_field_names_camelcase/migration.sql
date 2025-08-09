/*
  Warnings:

  - You are about to drop the column `expires_at` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `id_token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `token_type` on the `Account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "zen_flow"."Account" DROP COLUMN "expires_at",
DROP COLUMN "id_token",
DROP COLUMN "token_type",
ADD COLUMN     "expiresAt" INTEGER,
ADD COLUMN     "idToken" TEXT,
ADD COLUMN     "tokenType" TEXT;
