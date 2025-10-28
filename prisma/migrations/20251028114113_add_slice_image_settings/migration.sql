/*
  Warnings:

  - You are about to drop the column `sliceOffsets` on the `grid_maps` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "grid_maps" DROP COLUMN "sliceOffsets",
ADD COLUMN     "sliceImageSettings" JSONB NOT NULL DEFAULT '{}';
