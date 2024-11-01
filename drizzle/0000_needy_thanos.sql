CREATE TABLE IF NOT EXISTS "barangs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "barangs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"code" text NOT NULL,
	"status" text NOT NULL,
	"condition" text NOT NULL,
	"warranty" date NOT NULL,
	"photo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kendaraans" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kendaraans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"plat" text NOT NULL,
	"status" text NOT NULL,
	"condition" text NOT NULL,
	"warranty" text NOT NULL,
	"category" text NOT NULL,
	"coloer" text NOT NULL,
	"photo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kendaraans_plat_unique" UNIQUE("plat")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "peminjamans" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "peminjamans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"status" text NOT NULL,
	"category" text NOT NULL,
	"borrowed_date" timestamp with time zone NOT NULL,
	"estimated_time" timestamp with time zone NOT NULL,
	"return_date" timestamp with time zone NOT NULL,
	"objective" text NOT NULL,
	"passenger" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" integer NOT NULL,
	"ruangan_id" integer NOT NULL,
	"barang_id" integer NOT NULL,
	"kendaraan_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ruangans" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ruangans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" text NOT NULL,
	"status" text NOT NULL,
	"capacity" integer NOT NULL,
	"category" text NOT NULL,
	"photo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id_barang" integer NOT NULL,
	CONSTRAINT "ruangans_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tempats" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tempats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"category" text NOT NULL,
	"photo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id_ruangan" integer,
	"id_kendaraan" integer,
	CONSTRAINT "tempats_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"division" text NOT NULL,
	"place" text NOT NULL,
	"address" text NOT NULL,
	"photo" text,
	"phone_number" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "logs" ADD CONSTRAINT "logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peminjamans" ADD CONSTRAINT "peminjamans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peminjamans" ADD CONSTRAINT "peminjamans_ruangan_id_ruangans_id_fk" FOREIGN KEY ("ruangan_id") REFERENCES "public"."ruangans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peminjamans" ADD CONSTRAINT "peminjamans_barang_id_barangs_id_fk" FOREIGN KEY ("barang_id") REFERENCES "public"."barangs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peminjamans" ADD CONSTRAINT "peminjamans_kendaraan_id_kendaraans_id_fk" FOREIGN KEY ("kendaraan_id") REFERENCES "public"."kendaraans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ruangans" ADD CONSTRAINT "ruangans_id_barang_barangs_id_fk" FOREIGN KEY ("id_barang") REFERENCES "public"."barangs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tempats" ADD CONSTRAINT "tempats_id_ruangan_ruangans_id_fk" FOREIGN KEY ("id_ruangan") REFERENCES "public"."ruangans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tempats" ADD CONSTRAINT "tempats_id_kendaraan_kendaraans_id_fk" FOREIGN KEY ("id_kendaraan") REFERENCES "public"."kendaraans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
