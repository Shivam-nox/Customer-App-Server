CREATE TYPE "public"."kyc_status" AS ENUM('pending', 'submitted', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('order_update', 'payment', 'kyc', 'delivery', 'general');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'in_transit', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('upi', 'cards', 'netbanking', 'wallet', 'cod');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'driver', 'admin');--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"label" text NOT NULL,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"landmark" text,
	"area" text NOT NULL,
	"city" text DEFAULT 'Bangalore' NOT NULL,
	"state" text DEFAULT 'Karnataka' NOT NULL,
	"pincode" varchar(6) NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"poc_name" text,
	"poc_phone" varchar(15),
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"username" varchar(50),
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"phone" varchar(15) NOT NULL,
	"business_name" text,
	"business_address" text,
	"industry_type" text,
	"gst_number" varchar(15),
	"pan_number" varchar(10),
	"cin_number" varchar(21),
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"kyc_status" "kyc_status" DEFAULT 'pending' NOT NULL,
	"kyc_documents" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_username_unique" UNIQUE("username"),
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "driver_vehicle_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" varchar NOT NULL,
	"vehicle_id" varchar NOT NULL,
	"assigned_date" timestamp DEFAULT now() NOT NULL,
	"unassigned_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"assigned_by" varchar,
	"unassigned_by" varchar,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text,
	"password_hash" text,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"address" text NOT NULL,
	"city" text DEFAULT 'Empty' NOT NULL,
	"state" text DEFAULT 'Empty' NOT NULL,
	"pincode" text DEFAULT 'Empty' NOT NULL,
	"kyc_status" text,
	"aadhaar_number" text,
	"pan_number" text,
	"driving_license_number" text,
	"driving_license_expiry" timestamp,
	"bank_account_number" text,
	"bank_ifsc_code" text,
	"bank_account_holder_name" text,
	"bank_name" text,
	"kyc_documents" jsonb,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"remarks" text,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"reviewed_by" varchar,
	"current_vehicle_id" varchar,
	"status" text,
	"current_location" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"total_deliveries" integer DEFAULT 0 NOT NULL,
	"successful_deliveries" integer DEFAULT 0 NOT NULL,
	"deliveries_this_month" integer DEFAULT 0 NOT NULL,
	"last_check_in" timestamp,
	"joined_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "drivers_username_unique" UNIQUE("username"),
	CONSTRAINT "drivers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "drivers_kyc_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"drivers_license" text,
	"aadhaar" text,
	"pan" text,
	"bank_account_details" text,
	"status" text,
	"remarks" text,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"driver" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"order_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"customer_id" varchar NOT NULL,
	"quantity" integer NOT NULL,
	"rate_per_liter" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"delivery_charges" numeric(10, 2) NOT NULL,
	"gst" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"delivery_address" text NOT NULL,
	"delivery_address_id" varchar,
	"delivery_latitude" numeric(10, 7),
	"delivery_longitude" numeric(10, 7),
	"scheduled_date" timestamp NOT NULL,
	"scheduled_time" varchar(5) NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"driver_id" varchar,
	"delivery_otp" varchar(6),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "otp_verifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"otp" varchar(6) NOT NULL,
	"type" varchar(10) NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"transaction_id" varchar(100),
	"gateway_response" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_checks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" varchar NOT NULL,
	"vehicle_id" varchar NOT NULL,
	"order_id" varchar,
	"check_type" text NOT NULL,
	"category" text NOT NULL,
	"status" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"notes" text,
	"photo_urls" jsonb,
	"location" jsonb,
	"checklist_items" jsonb,
	"requires_follow_up" boolean DEFAULT false NOT NULL,
	"follow_up_date" timestamp,
	"resolved_date" timestamp,
	"resolved_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sample_table" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"value_one" text NOT NULL,
	"value_two" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(50) NOT NULL,
	"value" text NOT NULL,
	"data_type" varchar(20) DEFAULT 'number' NOT NULL,
	"description" text,
	"category" varchar(50) DEFAULT 'pricing' NOT NULL,
	"is_editable" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" varchar,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "vehicles_kyc_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"number_plate" text,
	"peso_license" text,
	"calibration_license" text,
	"insurance" text,
	"fire_extinguisher_certificate" text,
	"status" text,
	"remarks" text,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"driver" varchar NOT NULL
);

--> statement-breakpoint
ALTER TABLE "driver_vehicle_assignments" ADD CONSTRAINT "driver_vehicle_assignments_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_vehicle_assignments" ADD CONSTRAINT "driver_vehicle_assignments_vehicle_id_vehicles_kyc_documents_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles_kyc_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers_kyc_documents" ADD CONSTRAINT "drivers_kyc_documents_user_id_drivers_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers_kyc_documents" ADD CONSTRAINT "drivers_kyc_documents_driver_drivers_id_fk" FOREIGN KEY ("driver") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_address_id_customer_addresses_id_fk" FOREIGN KEY ("delivery_address_id") REFERENCES "public"."customer_addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_checks" ADD CONSTRAINT "route_checks_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_checks" ADD CONSTRAINT "route_checks_vehicle_id_vehicles_kyc_documents_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles_kyc_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_checks" ADD CONSTRAINT "route_checks_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample_table" ADD CONSTRAINT "sample_table_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles_kyc_documents" ADD CONSTRAINT "vehicles_kyc_documents_user_id_drivers_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles_kyc_documents" ADD CONSTRAINT "vehicles_kyc_documents_driver_drivers_id_fk" FOREIGN KEY ("driver") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;




CREATE TABLE IF NOT EXISTS "shivam" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" varchar NOT NULL,
  "value_one" text NOT NULL,
  "value_two" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

