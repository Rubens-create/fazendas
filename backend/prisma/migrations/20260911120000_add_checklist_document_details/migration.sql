-- AlterTable
ALTER TABLE "public"."farm_checklist_items" ADD COLUMN     "document_date" DATE,
ADD COLUMN     "document_status" TEXT,
ADD COLUMN     "due_date" DATE,
ADD COLUMN     "renewal_comments" TEXT,
ADD COLUMN     "renewal_date" DATE;

