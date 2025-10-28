-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "smsResetCode" TEXT,
ADD COLUMN     "smsResetExpiry" TIMESTAMP(3);
