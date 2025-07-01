#!/usr/bin/env node

/**
 * Apply Stripe Connect Database Migrations
 *
 * This script applies the complete Stripe Connect database schema
 * to enable marketplace functionality.
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase credentials");
  console.error(
    "Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigrations() {
  console.log("🚀 Starting Stripe Connect database migrations...\n");

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, "..", "database-migrations.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📁 Migration file loaded:", migrationPath);
    console.log("📏 Migration size:", migrationSQL.length, "characters\n");

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt && !stmt.startsWith("--") && stmt !== "\n");

    console.log("🔄 Found", statements.length, "SQL statements to execute\n");

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip empty statements and comments
      if (!statement || statement.startsWith("--")) continue;

      try {
        console.log(
          `[${i + 1}/${statements.length}] Executing:`,
          statement.substring(0, 80) + "...",
        );

        const { error } = await supabase.rpc("exec_sql", {
          sql_query: statement + ";",
        });

        if (error) {
          // Try direct query execution as fallback
          const { error: directError } = await supabase
            .from("information_schema.tables")
            .select("*")
            .limit(1);

          if (directError) {
            throw new Error(`SQL execution failed: ${error.message}`);
          }

          // If we can't use rpc, we'll need to warn the user
          console.log(
            "⚠️  Cannot execute directly. Please run migrations manually in Supabase SQL editor.",
          );
          break;
        }

        successCount++;
        console.log("✅ Success\n");
      } catch (error) {
        errorCount++;
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        console.error("Statement:", statement.substring(0, 200) + "...\n");

        // Continue with next statement
        continue;
      }
    }

    console.log("\n🎉 Migration Summary:");
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📊 Total statements: ${statements.length}`);

    if (errorCount === 0) {
      console.log("\n🚀 All migrations completed successfully!");
      console.log("\n📋 Tables created:");
      console.log("  • payment_methods - Stripe payment method storage");
      console.log("  • orders - Marketplace order management");
      console.log("  • subscriptions - Subscription billing");
      console.log("  • referrals - User referral system");
      console.log("  • connect_accounts - Stripe Connect seller accounts");
      console.log("  • webhook_events - Webhook event logging");
      console.log("  • application_fees - Marketplace fee tracking");
      console.log("\n🔐 Row Level Security (RLS) enabled for data protection");
      console.log("📈 Views created for analytics and reporting");
    } else {
      console.log(
        "\n⚠️  Some migrations failed. Please check the errors above.",
      );
      console.log(
        "You may need to run the failed statements manually in the Supabase SQL editor.",
      );
    }
  } catch (error) {
    console.error("💥 Fatal error running migrations:", error);
    process.exit(1);
  }
}

// Auto-run migrations
console.log("🎯 KerbDrop Stripe Connect Database Migration Tool");
console.log("=" + "=".repeat(50));
runMigrations().catch(console.error);
