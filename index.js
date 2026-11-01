import { Telegraf, Markup } from "telegraf";

const FIREBASE_URL = "https://revzz-license-key-default-rtdb.firebaseio.com";
const WEB_DASHBOARD = "https://revzz-license-key.vercel.app/dashboard.html";
const WEB_CREATE = "https://revzz-license-key.vercel.app/createkey.html";

function genKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rand = (n) => {
    let s = "";
    for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  };
  return "REVZ-" + rand(4) + "-" + rand(4) + "-" + rand(4);
}

export default {
  async fetch(request, env, ctx) {
    const bot = new Telegraf(env.BOT_TOKEN);

    const mainMenu = Markup.keyboard([
      [Markup.button.text("🔑 GET KEY"), Markup.button.text("📋 LIST KEY")],
      [Markup.button.text("👤 AKUN SAYA"), Markup.button.text("❓ BANTUAN")],
      [Markup.button.text("☎️ HUBUNGI OWNER"), Markup.button.text("🌐 DASHBOARD")]
    ]).resize();

    bot.start((ctx) => {
      return ctx.reply("REVZZ LICENSE BOT - Halo " + ctx.from.first_name + "! Klik GET KEY. Dashboard: " + WEB_DASHBOARD, mainMenu);
    });

    const giveKey = async (ctx) => {
      const newKey = genKey();
      const payload = {
        key: newKey,
        ownerId: ctx.from.id,
        owner: ctx.from.username || ctx.from.first_name,
        created: new Date().toISOString(),
        status: "active",
        source: "telegram"
      };
      try {
        await fetch(FIREBASE_URL + "/keys/" + newKey + ".json", {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" }
        });
        return ctx.replyWithHTML("✅ KEY BERHASIL!\n\n🔑 <code>" + newKey + "</code>\n\n📊 Cek: " + WEB_DASHBOARD, mainMenu);
      } catch (e) {
        return ctx.reply("Error: " + e.message, mainMenu);
      }
    };

    bot.hears("🔑 GET KEY", giveKey);
    bot.command("getkey", giveKey);

    bot.hears("📋 LIST KEY", async (ctx) => {
      try {
        const res = await fetch(FIREBASE_URL + "/keys.json");
        const data = await res.json();
        if (!data) return ctx.reply("Belum ada key.", mainMenu);
        const keys = Object.keys(data);
        let text = "TOTAL " + keys.length + " KEYS (10 terbaru):\n\n";
        keys.slice(-10).reverse().forEach((k, i) => {
          text += (i + 1) + ". " + k + "\n";
        });
        text += "\nLengkap: " + WEB_DASHBOARD;
        return ctx.reply(text, mainMenu);
      } catch (e) {
        return ctx.reply("Error: " + e.message, mainMenu);
      }
    });

    bot.hears("👤 AKUN SAYA", (ctx) => {
      return ctx.reply("AKUN SAYA\nID: " + ctx.from.id + "\nUsername: @" + (ctx.from.username || "-"), mainMenu);
    });

    bot.hears("❓ BANTUAN", (ctx) => {
      return ctx.reply("BANTUAN\nDashboard: " + WEB_DASHBOARD + "\nCreate: " + WEB_CREATE, mainMenu);
    });

    bot.hears("☎️ HUBUNGI OWNER", (ctx) => {
      return ctx.reply("Owner:", Markup.inlineKeyboard([[Markup.button.url("Chat Owner", "https://t.me/revzzptr")]]));
    });

    bot.hears("🌐 DASHBOARD", (ctx) => {
      return ctx.reply("Buka Web:", Markup.inlineKeyboard([
        [Markup.button.url("Dashboard", WEB_DASHBOARD)],
        [Markup.button.url("Create Key", WEB_CREATE)]
      ]));
    });

    if (request.method === "POST") {
      try {
        await bot.handleUpdate(await request.json());
      } catch (e) {}
      return new Response("OK");
    }

    return new Response("REVZZ BOT CONNECTED");
  }
};
