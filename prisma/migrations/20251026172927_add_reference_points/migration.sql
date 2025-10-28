-- AlterTable
ALTER TABLE "grid_maps" ADD COLUMN     "referenceColors" JSONB NOT NULL DEFAULT '{"top": "#ffffff", "right": "#ff0000", "bottom": "#000000", "left": "#01b050"}',
ADD COLUMN     "showReferencePoints" BOOLEAN NOT NULL DEFAULT false;
