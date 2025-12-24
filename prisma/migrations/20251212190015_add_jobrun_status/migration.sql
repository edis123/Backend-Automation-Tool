/*
  Warnings:

  - Added the required column `status` to the `JobRun` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JobRun" ADD COLUMN     "status" TEXT NOT NULL;
