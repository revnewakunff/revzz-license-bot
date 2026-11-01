import { Telegraf, Markup } from "telegraf";

const FIREBASE_URL = "https://revzz-license-key-default-rtdb.firebaseio.com";
const waiting = new Map();

function genKey() {
  try {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    function rand(n) {
      var s = "";
      for (var i = 0; i < n; i++) {
        s += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return s;
    }
    return "REVZ-" + rand(4) + "-" + rand(4) + "-" + rand(4);
  } catch (e) {
    return "REVZ-ERROR-" + Date.now();
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      var bot = new Telegraf(env.BOT_TOKEN);

      var mainMenu = Markup.keyboard([
        ["GET KEY", "LIST KEY"],
        ["AKUN SAYA", "BANTUAN"],
        ["HUBUNGI OWNER"]
      ]).resize();

      bot.start(function(c) {
        try { return c.reply("REVZZ BOT AKTIF - Klik GET KEY", mainMenu); } catch (e) {}
      });

      function askCustom(ctx) {
        try {
          waiting.set(ctx.from.id, true);
          return ctx.reply(
            "ATUR KEY MANUAL\n\n" +
            "Format: HARI DEVICE\n\n" +
            "Contoh:\n" +
            "30 2 = 30 hari 2 device\n" +
            "30 0 = 30 hari UNLIMITED\n" +
            "30 unlimited = unlimited\n\n" +
            "Ketik sekarang:",
            mainMenu
          );
        } catch (e) {
          return ctx.reply("Error: " + e.message);
        }
      }

      bot.hears("GET KEY", askCustom);
      bot.command("getkey", askCustom);

      bot.hears(/^\d+\s+(\d+|unlimited|unli|unlimit|inf|0)$/i, async function(ctx) {
        try {
          if (!waiting.has(ctx.from.id)) return;
          waiting.delete(ctx.from.id);

          var parts = ctx.message.text.trim().split(/\s+/);
          var DAYS = parseInt(parts[0]);
          var devInput = parts[1].toLowerCase();
          var DEVICES;
          var isUnlimited = false;

          if (devInput === "0" || devInput.indexOf("unli") !== -1 || devInput === "inf") {
            isUnlimited = true;
            DEVICES = 999999;
          } else {
            DEVICES = parseInt(devInput);
          }

          if (isNaN(DAYS) || DAYS <= 0 || DAYS > 3650) {
            return ctx.reply("Hari harus 1-3650", mainMenu);
          }
          if (!isUnlimited && (isNaN(DEVICES) || DEVICES < 0 || DEVICES > 1000)) {
            return ctx.reply("Device harus 0-1000 atau unlimited", mainMenu);
          }

          var newKey = genKey();
          var now = new Date();
          var expire = new Date();
          expire.setDate(now.getDate() + DAYS);

          var payload = {
            key: newKey,
            days: DAYS,
            maxDevices: DEVICES,
            devices: DEVICES,
            unlimited: isUnlimited,
            ownerId: ctx.from.id,
            owner: ctx.from.username || "unknown",
            created: now.toISOString(),
            expiresAt: expire.toISOString(),
            status: "active"
          };

          await fetch(FIREBASE_URL + "/keys/" + newKey + ".json", {
            method: "PUT",
            body: JSON.stringify(payload)
          });

          var deviceText = isUnlimited ? "UNLIMITED" : DEVICES + " Device";

          return ctx.replyWithHTML(
            "<b>KEY BERHASIL!</b>\n\n" +
            "Key: <code>" + newKey + "</code>\n\n" +
            "Durasi: " + DAYS + " Days\n" +
            "Device: " + deviceText + "\n" +
            "Expire: " + expire.toLocaleDateString(),
            mainMenu
          );
        } catch (err) {
          try { return ctx.reply("Error: " + err.message, mainMenu); } catch (e) {}
        }
      });

      bot.hears("LIST KEY", async function(ctx) {
        try {
          var res = await fetch(FIREBASE_URL + "/keys.json");
          var data = await res.json();
          if (!data) return ctx.reply("Belum ada key", mainMenu);
          var keys = Object.keys(data);
          var text = "TOTAL " + keys.length + " KEYS:\n\n";
          keys.slice(-10).reverse().forEach(function(k) {
            var d = data[k];
            var dev = d.unlimited ? "UNLI" : (d.maxDevices || 0) + " dev";
            text += k + " | " + (d.days || 0) + "d | " + dev + "\n";
          });
          return ctx.reply(text, mainMenu);
        } catch (err) {
          return ctx.reply("Error LIST: " + err.message, mainMenu);
        }
      });

      bot.hears("AKUN SAYA", function(c) { try { return c.reply("ID: " + c.from.id, mainMenu); } catch (e) {} });
      bot.hears("BANTUAN", function(c) { try { return c.reply("Ketik GET KEY terus HARI DEVICE contoh 30 0 buat unlimited", mainMenu); } catch (e) {} });
      bot.hears("HUBUNGI OWNER", function(c) { try { return c.reply("Owner:", Markup.inlineKeyboard([[Markup.button.url("Owner", "https://t.me/revzzptr")]])); } catch (e) {} });

      if (request.method === "POST") {
        try {
          var body = await request.json();
          await bot.handleUpdate(body);
        } catch (e) {}
        return new Response("OK");
      }

      return new Response("BOT OK - ANTI BUG");

    } catch (err) {
      return new Response("BOT ERROR: " + err.message, { status: 500 });
    }
  }
};
