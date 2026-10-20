UPDATE "public"."users"
SET "role" = 'SUPER_ADMIN'
WHERE "id" = (
  SELECT "id"
  FROM "public"."users"
  ORDER BY "created_at" ASC, "id" ASC
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1
  FROM "public"."users"
  WHERE "role" = 'SUPER_ADMIN'
);
