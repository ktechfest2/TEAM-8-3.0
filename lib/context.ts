import { ConsoleMessaging, TwilioMessaging } from "@/lib/providers/messaging";
import { MockIRev, MockVoterLookup } from "@/lib/providers/mock";
import type { IRevProvider, MessagingProvider, VoterLookupProvider } from "@/lib/providers/types";
import { SEED_UNITS, seedDemoReports } from "@/lib/seed";
import { MemoryStore } from "@/lib/store/memory";
import { SupabaseStore } from "@/lib/store/supabase";
import type { Store } from "@/lib/store/types";

export interface Deps {
  store: Store;
  voterLookup: VoterLookupProvider;
  irev: IRevProvider;
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
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let salt = process.env.PHONE_HASH_SALT ?? "";

  let store: Store;
  if (url && key) {
    if (!salt) throw new Error("PHONE_HASH_SALT must be set when Supabase is configured");
    store = new SupabaseStore(url, key);
  } else {
    if (!salt) {
      salt = DEV_SALT;
      warnings.push("PHONE_HASH_SALT is not set; using a development salt.");
    }
    warnings.push("Supabase is not configured: using an in-memory demo store. Data resets on restart.");
    store = new MemoryStore(SEED_UNITS);
    await seedDemoReports(store, salt);
  }

  // Only mock providers exist. A real VoterLookup or IRev provider would be selected here.
  return { store, voterLookup: new MockVoterLookup(), irev: new MockIRev(), messaging: buildMessaging(), salt, warnings };
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
