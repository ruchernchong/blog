-- CreateTable
CREATE TABLE "Views" (
    "slug" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Views_pkey" PRIMARY KEY ("slug")
);

