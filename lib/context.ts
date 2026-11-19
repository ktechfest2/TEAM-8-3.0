import { ConsoleMessaging, TwilioMessaging } from "@/lib/providers/messaging";
import { MockVoterLookup } from "@/lib/providers/mock";
import type { MessagingProvider, VoterLookupProvider } from "@/lib/providers/types";
import { SEED_UNITS, seedDemoReports } from "@/lib/seed";
import { MemoryStore } from "@/lib/store/memory";
import { PostgresStore } from "@/lib/store/postgres";
import { neonSql } from "@/lib/db/neon";
import type { Store } from "@/lib/store/types";

export interface Deps {
  store: Store;
  voterLookup: VoterLookupProvider;
  messaging: MessagingProvider;
  salt: string;
  warnings: string[];
}

const DEV_SALT = "tally-dev-salt-do-not-use-in-production";

function buildMessaging(): MessagingProvider {
  if (process.env.MESSAGING_PROVIDER === "twilio") {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error("MESSAGING_PROVIDER=twilio needs TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN");
    return new TwilioMessaging(sid, token, process.env.TWILIO_WHATSAPP_FROM, process.env.TWILIO_SMS_FROM);
  }
  return new ConsoleMessaging();
}

async function build(): Promise<Deps> {
  const warnings: string[] = [];
  const databaseUrl = process.env.DATABASE_URL;
  let salt = process.env.PHONE_HASH_SALT ?? "";

  let store: Store;
  if (databaseUrl) {
    if (!salt) throw new Error("PHONE_HASH_SALT must be set when DATABASE_URL is set");
    store = new PostgresStore(neonSql(databaseUrl));
  } else {
    if (!salt) {
      salt = DEV_SALT;
      warnings.push("PHONE_HASH_SALT is not set; using a development salt.");
    }
    warnings.push("DATABASE_URL is not set: using an in-memory demo store. Data resets on restart.");
    store = new MemoryStore(SEED_UNITS);
    await seedDemoReports(store, salt);
  }

  // Only a mock voter lookup exists. A real one would be selected here.
  return { store, voterLookup: new MockVoterLookup(), messaging: buildMessaging(), salt, warnings };
}

const g = globalThis as unknown as { __tallyDeps?: Promise<Deps> };

/** One set of dependencies per server instance (survives Next dev hot reloads). */
export function getDeps(): Promise<Deps> {
  if (!g.__tallyDeps) {
    g.__tallyDeps = build().catch((e) => {
      g.__tallyDeps = undefined;
      throw e;
    });
  }
  return g.__tallyDeps;
}
