import type { Delivery, MessagingProvider } from "./types";

/** Default. Replies are shown in the app (simulator) or returned inline as TwiML. Nothing leaves the server. */
export class ConsoleMessaging implements MessagingProvider {
  readonly name = "console";
  async send(to: string, body: string): Promise<Delivery> {
    const channel = to.startsWith("whatsapp:") ? "whatsapp" : to.startsWith("sim:") ? "simulator" : "sms";
    // Never log the address itself.
    console.info(`[tally:console-messaging] reply via ${channel} (${body.length} chars)`);
    return { delivered: false, via: "console" };
  }
}

/** Optional. Sends through Twilio's REST API. Enabled with MESSAGING_PROVIDER=twilio. */
export class TwilioMessaging implements MessagingProvider {
  readonly name = "twilio";
  constructor(
    private readonly accountSid: string,
    private readonly authToken: string,
    private readonly whatsappFrom: string | undefined,
    private readonly smsFrom: string | undefined,
  ) {}

  async send(to: string, body: string): Promise<Delivery> {
    const isWhatsApp = to.startsWith("whatsapp:");
    const from = isWhatsApp ? this.whatsappFrom : this.smsFrom;
    if (!from) throw new Error(`Twilio sender for ${isWhatsApp ? "WhatsApp" : "SMS"} is not configured`);
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body.slice(0, 1600) }),
    });
    if (!res.ok) throw new Error(`Twilio send failed with HTTP ${res.status}`);
    return { delivered: true, via: "twilio" };
  }
}
