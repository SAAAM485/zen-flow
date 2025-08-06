-- CreateEnum
CREATE TYPE "zen_flow"."ReactionType" AS ENUM ('LIKE', 'INSIGHTFUL', 'THANKS', 'HAHA');

-- AlterTable
ALTER TABLE "zen_flow"."Comment" ADD COLUMN     "isHighlighted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "zen_flow"."CommentLike" ADD COLUMN     "type" "zen_flow"."ReactionType" NOT NULL DEFAULT 'LIKE';

-- AlterTable
ALTER TABLE "zen_flow"."PostLike" ADD COLUMN     "type" "zen_flow"."ReactionType" NOT NULL DEFAULT 'LIKE';
