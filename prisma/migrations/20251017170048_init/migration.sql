-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grid_maps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageSrc" TEXT NOT NULL,
    "imageFile" JSONB,
    "imageDimensions" JSONB,
    "cellSize" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "unit" TEXT NOT NULL DEFAULT 'px',
    "dpi" INTEGER NOT NULL DEFAULT 96,
    "gridOffset" JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
    "gridColor" TEXT NOT NULL DEFAULT '#000000',
    "labelColor" TEXT NOT NULL DEFAULT '#000000',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "gridThickness" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "splitCols" INTEGER NOT NULL DEFAULT 1,
    "splitRows" INTEGER NOT NULL DEFAULT 1,
    "sliceNames" JSONB NOT NULL DEFAULT '[]',
    "showCenterCoords" BOOLEAN NOT NULL DEFAULT false,
    "showScaleBar" BOOLEAN NOT NULL DEFAULT true,
    "imageZoom" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "panOffset" JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "grid_maps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "grid_maps" ADD CONSTRAINT "grid_maps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
