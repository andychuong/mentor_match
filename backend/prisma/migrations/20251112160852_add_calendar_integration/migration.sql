-- CreateEnum
CREATE TYPE "CalendarProvider" AS ENUM ('google', 'outlook');

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "google_meet_link" TEXT;

-- CreateTable
CREATE TABLE "favorite_mentors" (
    "id" TEXT NOT NULL,
    "mentee_id" TEXT NOT NULL,
    "mentor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_mentors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_integrations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "CalendarProvider" NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "calendar_id" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sync_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "calendar_integration_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "provider" "CalendarProvider" NOT NULL,
    "calendar_id" TEXT NOT NULL,
    "html_link" TEXT,
    "ical_uid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorite_mentors_mentee_id_idx" ON "favorite_mentors"("mentee_id");

-- CreateIndex
CREATE INDEX "favorite_mentors_mentor_id_idx" ON "favorite_mentors"("mentor_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_mentors_mentee_id_mentor_id_key" ON "favorite_mentors"("mentee_id", "mentor_id");

-- CreateIndex
CREATE INDEX "calendar_integrations_user_id_idx" ON "calendar_integrations"("user_id");

-- CreateIndex
CREATE INDEX "calendar_integrations_provider_idx" ON "calendar_integrations"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_integrations_user_id_provider_key" ON "calendar_integrations"("user_id", "provider");

-- CreateIndex
CREATE INDEX "calendar_events_session_id_idx" ON "calendar_events"("session_id");

-- CreateIndex
CREATE INDEX "calendar_events_calendar_integration_id_idx" ON "calendar_events"("calendar_integration_id");

-- CreateIndex
CREATE INDEX "calendar_events_event_id_idx" ON "calendar_events"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_session_id_calendar_integration_id_key" ON "calendar_events"("session_id", "calendar_integration_id");

-- AddForeignKey
ALTER TABLE "favorite_mentors" ADD CONSTRAINT "favorite_mentors_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_mentors" ADD CONSTRAINT "favorite_mentors_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_calendar_integration_id_fkey" FOREIGN KEY ("calendar_integration_id") REFERENCES "calendar_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
