import { Telegraf, Markup } from "telegraf";

const FIREBASE_URL = "https://revzz-license-key-default-rtdb.firebaseio.com";
const WEB_DASHBOARD = "https://revzz-license-key.vercel.app/dashboard.html";
const WEB_CREATE = "https://revzz-license-key.vercel.app/createkey.html";

function genKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rand = (n) => Array.from({length:n}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  return `REVZ-${rand(4)}-${rand(4)}-${rand(4)}`;
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
      return ctx.replyWithHTML(
        `🔑 <b>REVZZ LICENSE BOT</b>\n\nHalo <b>${ctx.from.first_name}</b>!\n\n🌐 Dashboard: ${WEB_DASHBOARD}`,
        mainMenu
      );
    });

    const giveKey = async (ctx) => {
      const newKey = genKey();
      const payload = {
        key: newKey,
        ownerId: ctx.from.id,
        owner: ctx.from.username || ctx.from.first_name,
        name: ctx.from.first_name,
        created: new Date().toISOString(),
        status: "active",
        source: "telegram_bot"
      };

      try {
        await fetch(`${FIREBASE_URL}/keys/${newKey}.json`, {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" }
        });
        return ctx.replyWithHTML(
          `✅ <b>KEY BERHASIL!</b>\n\n🔑 <code>${newKey}</code>\n\n📊 Cek: ${WEB_DASHBOARD}`,
          mainMenu
        );
      } catch (e) {
        return ctx.reply(`Error: ${e.message}`, mainMenu);
      }
    };

    bot.hears("🔑 GET KEY", giveKey);
    bot.command("getkey", giveKey);

    bot.hears("📋 LIST KEY", async (ctx) => {
      try {
        const res = await fetch(`${FIREBASE_URL}/keys.json`);
        const data = await res.json();
        if (!data) return ctx.reply("Belum ada key.", mainMenu);
        const keys = Object.keys(data);
        let text = `📋 <b>${keys.length} KEYS</b>\n\n`;
        keys.slice(-10).reverse().forEach((k, i) => {
          text += `${i + 1}. <code>${k}</code>\n`;
        });
        text += `\n🌐 ${WEB_DASHBOARD}`;
        return ctx.replyWithHTML(text, mainMenu);
      } catch (e) {
        return ctx.reply(`Error: ${e.message}`, mainMenu);
      }
    });

    bot.hears("👤 AKUN SAYA", (ctx) => {
      return ctx.replyWithHTML(`👤 <b>AKUN SAYA</
