/*
  Warnings:

  - You are about to drop the `OAuthAccount` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "zen_flow"."OAuthAccount" DROP CONSTRAINT "OAuthAccount_userId_fkey";

-- DropTable
DROP TABLE "zen_flow"."OAuthAccount";

-- CreateTable
CREATE TABLE "zen_flow"."Account" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "zen_flow"."Account"("provider", "providerAccountId");

-- AddForeignKey
ALTER TABLE "zen_flow"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "zen_flow"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
