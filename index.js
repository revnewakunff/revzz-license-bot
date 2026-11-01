import { Telegraf, Markup } from "telegraf";

const FIREBASE_URL = "https://revzz-license-key-default-rtdb.firebaseio.com";

function genKey() {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var s = "REVZ-";
  for (var i = 0; i < 4; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  s += "-";
  for (var i = 0; i < 4; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  s += "-";
  for (var i = 0; i < 4; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

async function sendMessage(token, chatId, text) {
  await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML"
    })
  });
}

export default {
  async fetch(request, env, ctx) {
    try {
      if (request.method === "POST") {
        var update = await request.json();
        var msg = update.message;
        if (!msg || !msg.text) return new Response("OK");

        var chatId = msg.chat.id;
        var text = msg.text.trim();
        var token = env.BOT_TOKEN;

        if (text === "/start" || text.toLowerCase() === "get key" || text === "GET KEY") {
          await sendMessage(token, chatId,
            "REVZZ BOT AKTIF\n\n" +
            "Cara pakai, langsung ketik:\n" +
            "1 1 = 1 hari 1 device\n" +
            "30 2 = 30 hari 2 device\n" +
            "30 0 = 30 hari UNLIMITED\n" +
            "0 0 = PERMANENT + UNLIMITED\n\n" +
            "Langsung ketik angka sekarang:"
          );
          return new Response("OK");
        }

        var match = text.match(/^(\d+)\s+(\d+|unlimited|unli|0)$/i);
        if (match) {
          var DAYS_INPUT = parseInt(match[1]);
          var devInput = match[2].toLowerCase();

          var DAYS = DAYS_INPUT;
          var isPermanent = false;
          var isUnlimited = false;
          var DEVICES;

          if (DAYS_INPUT === 0) {
            isPermanent = true;
            DAYS = 3650; // buat hitung expire aja
          }

          if (devInput === "0" || devInput.indexOf("unli") !== -1) {
            isUnlimited = true;
            DEVICES = 9999; // FIX: JANGAN 999999, DASHBOARD LU GAK KUAT, PAKE 9999
          } else {
            DEVICES = parseInt(devInput);
          }

          var newKey = genKey();
          var now = new Date();
          var expire = new Date();
          if (isPermanent) {
            expire.setFullYear(now.getFullYear() + 10); // 10 tahun = permanent
          } else {
            expire.setDate(now.getDate() + DAYS);
          }

          // ===== FIX ANTI NaN & ANTI 0/1 DEVICE =====
          var expireMs = expire.getTime();
          var displayDays = isPermanent ? 9999 : DAYS_INPUT;

          var payload = {
            key: newKey,
            // HARI - FIX: JANGAN KIRIM 0, KIRIM 9999 BIAR GAK 0 Day
            days: displayDays,
            day: displayDays,
            duration: displayDays,
            durationDays: displayDays,
            validDays: displayDays,
            // DEVICE - KIRIM SEMUA VARIASI + ANGKA WAJAR
            maxDevices: DEVICES,
            maxDevice: DEVICES,
            devices: DEVICES,
            deviceLimit: DEVICES,
            limit: DEVICES,
            max: DEVICES,
            // TANGGAL - INI KUNCI FIX Invalid Date, KIRIM ANGKA & STRING
            expiresAt: expire.toISOString(),
            expireAt: expire.toISOString(),
            expiryDate: expire.toISOString(),
            expiredAt: expireMs, // DASHBOARD LU BUTUH INI ANGKA!
            expired: expireMs,
            expireAtNumber: expireMs,
            expiry: expireMs,
            validUntil: expireMs,
            expireTimestamp: expireMs,
            created: now.toISOString(),
            createdAt: now.getTime(), // ANGKA JUGA
            created_at: now.getTime(),
            unlimited: isUnlimited,
            permanent: isPermanent,
            status: "active",
            active: true,
            used: 0,
            ownerId: chatId
          };

          await fetch(FIREBASE_URL + "/keys/" + newKey + ".json", {
            method: "PUT",
            body: JSON.stringify(payload)
          });

          var dayText = isPermanent ? "PERMANENT" : DAYS_INPUT + " Day";
          var devText = isUnlimited ? "UNLIMITED" : DEVICES + " Device";

          await sendMessage(token, chatId,
            "<b>KEY BERHASIL!</b>\n\n" +
            "Key: <code>" + newKey + "</code>\n\n" +
            "Durasi: " + dayText + "\n" +
            "Device: " + devText + "\n" +
            "Expire: " + expire.toLocaleString() + "\n\n" +
            "Cek dashboard, pasti gak NaN lagi!"
          );
          return new Response("OK");
        }

        if (text.toLowerCase() === "list key" || text === "LIST KEY") {
          var res = await fetch(FIREBASE_URL + "/keys.json");
          var data = await res.json();
          if (!data) {
            await sendMessage(token, chatId, "Belum ada key");
          } else {
            var keys = Object.keys(data);
            var out = "TOTAL " + keys.length + " KEYS:\n\n";
            keys.slice(-10).reverse().forEach(function(k) {
              var d = data[k];
              out += k + " | " + (d.days || 0) + "d | " + (d.maxDevices || 0) + "\n";
            });
            await sendMessage(token, chatId, out);
          }
          return new Response("OK");
        }

        return new Response("OK");
      }

      return new Response("BOT OK - NO TELEGRAF");
    } catch (err) {
      return new Response("ERROR: " + err.message, { status: 500 });
    }
  }
};
