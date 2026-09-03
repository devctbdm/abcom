CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "fiber_clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"zone" text,
	"phone" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fiber_clients_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "fiber_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"brand" text NOT NULL,
	"core" integer DEFAULT 2 NOT NULL,
	"code" text DEFAULT 'FTTH' NOT NULL,
	"length_m" numeric(10, 2) NOT NULL,
	"amount" numeric(10, 2),
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiber_usages" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"purchase_id" integer,
	"date" date NOT NULL,
	"meters" numeric(10, 2) NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fuel_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer NOT NULL,
	"date" date NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"liters" numeric(8, 3) NOT NULL,
	"odometer" integer NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oil_changes" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" integer NOT NULL,
	"date" date NOT NULL,
	"odometer" integer NOT NULL,
	"oil_name" text NOT NULL,
	"amount" numeric(10, 2),
	"quantity" numeric(8, 3),
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"position" text NOT NULL,
	"phone" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'BIKE' NOT NULL,
	"reg_no" text NOT NULL,
	"fuel_type" text DEFAULT 'Petrol' NOT NULL,
	"oil_interval_km" integer DEFAULT 1200 NOT NULL,
	"owner_id" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fiber_usages" ADD CONSTRAINT "fiber_usages_client_id_fiber_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."fiber_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiber_usages" ADD CONSTRAINT "fiber_usages_purchase_id_fiber_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."fiber_purchases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oil_changes" ADD CONSTRAINT "oil_changes_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_owner_id_staff_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;