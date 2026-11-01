import { Telegraf, Markup } from "telegraf";

const FIREBASE_URL = "https://revzz-license-key-default-rtdb.firebaseio.com";

function genKey() {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  function rand(n) {
    var s = "";
    for (var i = 0; i < n; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return s;
  }
  return "REVZ-" + rand(4) + "-" + rand(4) + "-" + rand(4);
}

export default {
  async fetch(request, env, ctx) {
    var bot = new Telegraf(env.BOT_TOKEN);

    var mainMenu = Markup.keyboard([
      ["GET KEY", "LIST KEY"],
      ["AKUN SAYA", "BANTUAN"]
    ]).resize();

    bot.start((c) => c.reply("REVZZ BOT AKTIF\n\nSILAHKAN GETKEY DI MENU GETKEY", mainMenu));

    bot.hears("GET KEY", (c) => {
      return c.reply(
        "ATUR KEY MANUAL\n\nKetik format:\nHARI DEVICE\n\nContoh:\n0 0 = permanent + unlimited\n\nLangsung ketik aja sekarang:",
        mainMenu
      );
    });

    // INI YANG FIX - TANPA WAITING, LANGSUNG DETEKSI ANGKA
    bot.hears(/^(\d+)\s+(\d+|unlimited|unli|0)$/i, async (ctx) => {
      try {
        var text = ctx.message.text.trim();
        var parts = text.split(/\s+/);
        var DAYS = parseInt(parts[0]);
        var devInput = parts[1].toLowerCase();

        if (DAYS < 0 || DAYS > 36500) return ctx.reply("Hari 0-36500 aja bos");

        var isUnlimited = false;
        var isPermanent = false;
        var DEVICES;

        if (DAYS === 0) {
          isPermanent = true;
          DAYS = 36500;
        }

        if (devInput === "0" || devInput.indexOf("unli") !== -1) {
          isUnlimited = true;
          DEVICES = 999999;
        } else {
          DEVICES = parseInt(devInput);
          if (DEVICES < 0 || DEVICES > 9999) return ctx.reply("Device 0-9999");
        }

        var newKey = genKey();
        var now = new Date();
        var expire = new Date();
        if (isPermanent) {
          expire.setFullYear(now.getFullYear() + 100);
        } else {
          expire.setDate(now.getDate() + DAYS);
        }

        var payload = {
          key: newKey,
          days: isPermanent ? 0 : DAYS,
          day: isPermanent ? 0 : DAYS,
          duration: isPermanent ? 0 : DAYS,
          durationDays: isPermanent ? 0 : DAYS,
          validDays: isPermanent ? 0 : DAYS,
          maxDevices: DEVICES,
          maxDevice: DEVICES,
          devices: DEVICES,
          deviceLimit: DEVICES,
          expiresAt: expire.toISOString(),
          expireAt: expire.toISOString(),
          expiryDate: expire.toISOString(),
          expiredAt: expire.toISOString(),
          expiry: expire.toISOString(),
          created: now.toISOString(),
          createdAt: now.toISOString(),
          unlimited: isUnlimited,
          permanent: isPermanent,
          status: "active",
          active: true,
          used: 0,
          ownerId: ctx.from.id
        };

        var fbRes = await fetch(FIREBASE_URL + "/keys/" + newKey + ".json", {
          method: "PUT",
          body: JSON.stringify(payload)
        });

        if (!fbRes.ok) {
          return ctx.reply("Gagal simpan Firebase: " + fbRes.status);
        }

        var dayText = isPermanent ? "PERMANENT" : DAYS + " Day";
        var devText = isUnlimited ? "UNLIMITED" : DEVICES + " Device";

        return ctx.replyWithHTML(
          "<b>KEY BERHASIL!</b>\n\n" +
          "Key: <code>" + newKey + "</code>\n\n" +
          "Durasi: " + dayText + "\n" +
          "Device: " + devText + "\n" +
          "Expire: " + expire.toLocaleString() + "\n\n" +
          "Cek dashboard sekarang!",
          mainMenu
        );
      } catch (err) {
        return ctx.reply("Error: " + err.message);
      }
    });

    bot.hears("LIST KEY", async (ctx) => {
      try {
        var res = await fetch(FIREBASE_URL + "/keys.json");
        var data = await res.json();
        if (!data) return ctx.reply("Belum ada key", mainMenu);
        var keys = Object.keys(data);
        var text = "TOTAL " + keys.length + " KEYS:\n\n";
        keys.slice(-10).reverse().forEach((k) => {
          var d = data[k];
          var dev = d.unlimited ? "UNLI" : (d.maxDevices || 0) + " dev";
          text += k + " | " + (d.days || d.duration || 0) + "d | " + dev + "\n";
        });
        return ctx.reply(text, mainMenu);
      } catch (e) {
        return ctx.reply("Error list");
      }
    });

    bot.hears("AKUN SAYA", (c) => c.reply("ID: " + c.from.id, mainMenu));
    bot.hears("BANTUAN", (c) => c.reply("Ketik: HARI SPASI DEVICE contoh 1 1 atau 0 0 buat permanent unlimited", mainMenu));

    if (request.method === "POST") {
      try {
        await bot.handleUpdate(await request.json());
      } catch (e) {}
      return new Response("OK");
    }
    return new Response("BOT OK");
  }
};
