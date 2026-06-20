/*
  Warnings:

  - Added the required column `initiatedBy` to the `trainer_student_relationships` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RelationshipInitiator" AS ENUM ('TRAINER', 'STUDENT');

-- AlterTable
ALTER TABLE "trainer_student_relationships" ADD COLUMN     "initiatedBy" "RelationshipInitiator" NOT NULL;
