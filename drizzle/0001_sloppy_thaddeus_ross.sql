CREATE TYPE "public"."maintenance_type" AS ENUM('PARTS', 'SERVICE');--> statement-breakpoint
CREATE TABLE "maintenance" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer NOT NULL,
	"type" "maintenance_type" NOT NULL,
	"date" date NOT NULL,
	"time" timestamp,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"shop_name" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fuel_logs" ALTER COLUMN "odometer" SET DATA TYPE numeric(10, 1);--> statement-breakpoint
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;