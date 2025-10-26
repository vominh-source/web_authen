/*
Warnings:

- You are about to drop the column `apiKeyHash` on the `Client` table. All the data in the column will be lost.
- A unique constraint covering the columns `[apiKey]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
- Added the required column `apiKey` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- Add new column with temporary default
ALTER TABLE "Client"
ADD COLUMN "apiKey" TEXT NOT NULL DEFAULT 'temp-key';

-- Copy data from apiKeyHash to apiKey
UPDATE "Client" SET "apiKey" = "apiKeyHash";

-- Remove the temporary default
ALTER TABLE "Client" ALTER COLUMN "apiKey" DROP DEFAULT;

-- DropIndex
DROP INDEX "public"."Client_apiKeyHash_key";

-- Drop old column
ALTER TABLE "Client" DROP COLUMN "apiKeyHash";

-- CreateIndex
CREATE UNIQUE INDEX "Client_apiKey_key" ON "Client" ("apiKey");