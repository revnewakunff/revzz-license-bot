const { Telegraf } = require('telegraf');

// ===== GANTI INI =====
const BOT_TOKEN = "9199660804:AAGcZlVsmE60RmaGUTCHDC7uffn4mchjm0Y";
const OWNER_ID = [8775210157]; // ID tele lu, cek di @userinfobot
const DB_URL = "https://revzz-license-key-default-rtdb.firebaseio.com/keys";
// ======================

const bot = new Telegraf(BOT_TOKEN);

function genKey(){
  const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const r=()=>Array.from({length:4},()=>c[Math.floor(Math.random()*c.length)]).join('');
  return `REVZ-${r()}-${r()}-${r()}`;
}

const isOwner = (id) => OWNER_ID.includes(id);

// ==== UNTUK SEMUA (PEMBELI) ====
bot.start((ctx)=>{
  return ctx.reply(`🔥 *REVZZ LICENSE BOT* 🔥

Halo ${ctx.from.first_name}!
Ketik key lu buat cek:
\`REVZ-XXXX-XXXX-XXXX\`

Commands:
/check REVZ-XXXX-XXXX-XXXX - cek key
/myinfo - cek ID lu`, {parse_mode:"Markdown"});
});

bot.command('myinfo', (ctx)=> ctx.reply(`ID lu: ${ctx.from.id}\nUsername: @${ctx.from.username}`));

bot.command('check', async (ctx)=>{
  let key = ctx.message.text.split(' ')[1];
  if(!key) key = ctx.message.text.replace('/check','').trim();
  if(!key) return ctx.reply("Ketik: /check REVZ-VAJA-JSKH-KAHS");
  key = key.toUpperCase();
  const res = await fetch(`${DB_URL}/${key}.json`);
  const d = await res.json();
  if(!d) return ctx.reply("❌ Key tidak ditemukan");
  return ctx.reply(`🔑 *${d.key}*\n⏳ Durasi: ${d.duration}\n📱 Device: ${d.devicesUsed||0}/${d.max}\n✅ Status: ${d.status}\n📅 Dibuat: ${new Date(d.created).toLocaleDateString()}`, {parse_mode:"Markdown"});
});

// auto detek kalau user langsung kirim key tanpa /check
bot.hears(/^REVZ-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, async (ctx)=>{
  const key = ctx.message.text.toUpperCase().trim();
  const res = await fetch(`${DB_URL}/${key}.json`);
  const d = await res.json();
  if(!d) return ctx.reply("❌ Key tidak ditemukan");
  return ctx.reply(`🔑 *${d.key}*\n⏳ ${d.duration}\n📱 ${d.devicesUsed||0}/${d.max}`, {parse_mode:"Markdown"});
});

// ==== KHUSUS OWNER ====
bot.command('create', async (ctx)=>{
  if(!isOwner(ctx.from.id)) return ctx.reply("⛔ Khusus Owner!");
  const args = ctx.message.text.split(' ');
  const dur = parseInt(args[1])||1;
  const max = parseInt(args[2])||1;
  const key = genKey();
  await fetch(`${DB_URL}/${key}.json`,{
    method:"PUT",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({key, duration:`${dur} Day`, durationDay:dur, max, devicesUsed:0, deviceList:[], created:Date.now(), status:"active", createdBy:ctx.from.username})
  });
  ctx.reply(`✅ *Key Baru Dibuat (OWNER)*\n\n\`${key}\`\nDurasi: ${dur} Hari\nLimit: ${max} Device\n\nLangsung bisa dipakai di script/APK.`, {parse_mode:"Markdown"});
});

bot.command('gen', async (ctx)=>{
  if(!isOwner(ctx.from.id)) return;
  let jml = parseInt(ctx.message.text.split(' ')[1])||5;
  if(jml>20) jml=20;
  let list="";
  for(let i=0;i<jml;i++){
    const key=genKey();
    await fetch(`${DB_URL}/${key}.json`,{method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify({key, duration:"1 Day", durationDay:1, max:1, created:Date.now(), status:"active"})});
    list+=`${key}\n`;
  }
  ctx.reply(`✅ Generate ${jml} Key:\n\n\`${list}\``, {parse_mode:"Markdown"});
});

bot.command('del', async (ctx)=>{
  if(!isOwner(ctx.from.id)) return;
  const key = ctx.message.text.split(' ')[1]?.toUpperCase();
  if(!key) return ctx.reply("Cara: /del REVZ-XXXX-XXXX-XXXX");
  await fetch(`${DB_URL}/${key}.json`,{method:"DELETE"});
  ctx.reply(`🗑️ Key ${key} dihapus`);
});

bot.command('list', async (ctx)=>{
  if(!isOwner(ctx.from.id)) return;
  const res = await fetch(DB_URL+".json");
  const data = await res.json();
  if(!data) return ctx.reply("Belum ada key");
  const keys = Object.keys(data);
  ctx.reply(`📊 Total Key: ${keys.length}\n\n${keys.slice(-20).join('\n')}\n\n...20 key terbaru`);
});

bot.launch();
console.log("REVZZ BOT OWNER+PEMBELI JALAN...");