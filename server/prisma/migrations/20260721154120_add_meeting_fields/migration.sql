/*
  Warnings:

  - A unique constraint covering the columns `[roomCode]` on the table `Meeting` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `roomCode` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "roomCode" TEXT NOT NULL,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'scheduled',
ADD COLUMN     "title" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_roomCode_key" ON "Meeting"("roomCode");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_meetingID_fkey" FOREIGN KEY ("meetingID") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
