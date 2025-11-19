/*
  Warnings:

  - You are about to drop the `match_cache` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "match_cache";

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "mentee_id" TEXT NOT NULL,
    "mentor_id" TEXT NOT NULL,
    "match_score" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "matches_mentee_id_idx" ON "matches"("mentee_id");

-- CreateIndex
CREATE INDEX "matches_mentor_id_idx" ON "matches"("mentor_id");

-- CreateIndex
CREATE UNIQUE INDEX "matches_mentee_id_mentor_id_key" ON "matches"("mentee_id", "mentor_id");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
