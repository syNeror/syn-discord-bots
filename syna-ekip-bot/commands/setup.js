// commands/setup.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const config = require('../config.json');
const BRAND_NAME = `${config.footer.text}`;
const COLORS = { start: 0xf1c40f, step: 0x9b59b6, warn: 0xe67e22, done: 0x1abc9c };
const LOG_FILE = path.join(__dirname, '../data/log.json');

/* ---------------- JSON helpers ---------------- */
function loadLog() {
  if (!fs.existsSync(LOG_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); }
  catch { return {}; }
}
function saveLog(data) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/* Emojili adları JSON için temizler: "❗┆kswasted-log" -> "kswasted-log" */
function stripName(name) {
  if (name.includes('┆')) return name.slice(name.lastIndexOf('┆') + 1).trim();
  return name.replace(/^[^\w-]+/, '').trim();
}

/* ---------------- PLAN (senin verdiğin) ---------------- */
const PLAN = [
  {
    category: "</ CEZA LOG />",
    color: COLORS.step,
    channels: [
      "❗┆kswasted-log",
      "❗┆ksceza-log",
      "❗┆ksblacklist-log",
      "❗┆kswarn-log",
      "❗┆wlceza-log",
      "❗┆kscezatakip-log"
    ],
    successText: "Ceza sistemi başarıyla {AKSİYON}."
  },
  {
    category: "</ TİCKET LOG />",
    color: COLORS.step,
    channels: [
      "🎫┆ksticket-log",
      "🎫┆ksticket-yetkili-log"
    ],
    successText: "Ticket sistemi başarıyla {AKSİYON}."
  },
  {
    category: "</ GUARD LOG />",
    color: COLORS.step,
    channels: [
      "🌐┆ksguard-log",
      "🌐┆ksserver-log",
      "🌐┆ksrole-log",
      "🌐┆kschannel-log"
    ],
    successText: "Guard log sistemi {AKSİYON}."
  },
  {
    category: "</ STATS LOG />",
    color: COLORS.warn,
    channels: [
      "🪙┆ksstats-log",
      "🪙┆ksrank-log"
    ],
    successText: "Stats log sistemi {AKSİYON}."
  },
  {
    category: "</ KATESHİ LOG />",
    color: COLORS.step,
    channels: [
      "💻┆kscommand-log",
      "💻┆kssecurity-log",
      "💻┆ksgiris-log",
      "💻┆kssupheli-log",
      "💻┆kscikis-log",
      "💻┆ksdavet-log",
      "💻┆ksregister-log",
      "💻┆ksisim-log",
      "💻┆ksicisim-log",
      "💻┆ksrol-log",
      "💻┆ksban-log",
      "💻┆ksmessage-log",
      "💻┆ksvoice-log",
      "💻┆ksekip-log",
      "💻┆ksseslidestek-log",
      "💻┆ksyetkilibasvuru-log",
      "💻┆ksyetkili-bildirim"
    ],
    successText: "Synatx log sistemi başarıyla {AKSİYON}."
  }
];

/* ---------------- helpers ---------------- */
function baseEmbed(guild, color, title) {
  return new EmbedBuilder()
    .setAuthor({ name: guild.name, iconURL: guild.iconURL({ size: 256 }) || undefined })
    .setColor(color)
    .setTitle(title)
    .setFooter({ text: BRAND_NAME });
}

async function createIfNotExists(guild, planItem) {
  const logData = loadLog();

  // kategoriyi bul/oluştur
  let cat = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === planItem.category
  );
  if (!cat) {
    cat = await guild.channels.create({
      name: planItem.category,
      type: ChannelType.GuildCategory,
      permissionOverwrites: [{
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      }]
    });
  }

  // metin kanallarını oluştur ve JSON'a yaz
  for (const name of planItem.channels) {
    let ch = guild.channels.cache.find(
      c => c.type === ChannelType.GuildText && c.parentId === cat.id && c.name === name
    );
    if (!ch) {
      ch = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: cat.id
      });
    }
    logData[stripName(ch.name)] = ch.id; // <-- emojisiz anahtar
  }

  saveLog(logData);
}

async function deleteIfExists(guild, planItem, skipChannelId) {
  const logData = loadLog();

  const cat = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === planItem.category
  );
  if (!cat) return;

  // kategori altındaki tüm kanalları sırayla sil (komutun yazıldığı kanalı atla)
  const children = Array.from(guild.channels.cache.filter(ch => ch.parentId === cat.id).values());
  for (const ch of children) {
    if (ch.id === skipChannelId) continue;
    delete logData[stripName(ch.name)];
    await ch.delete().catch(() => {});
  }
  // eğer komut kanalı o kategoride değilse, kategoriyi de sil
  const stillHasChildren = guild.channels.cache.some(ch => ch.parentId === cat.id);
  if (!stillHasChildren) {
    await cat.delete().catch(() => {});
  }
  saveLog(logData);
}

/* ---------------- command ---------------- */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Log kanallarını kurar (aç) veya siler (kapat).')
    .addStringOption(opt =>
      opt.setName('durum')
        .setDescription('Kanalları aç ya da kapat')
        .setRequired(true)
        .addChoices(
          { name: 'AC', value: 'ac' },
          { name: 'KAPA', value: 'kapat' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Sadece owner kullanabilir
    if (interaction.user.id !== config.ownerId) {
      return interaction.reply({ content: '❌ Bu komutu sadece bot sahibi kullanabilir!', ephemeral: true });
    }

    const { guild, channel } = interaction;
    const mode = interaction.options.getString('durum'); // 'ac' | 'kapat'
    const AKSIYON = mode === 'ac' ? 'açıldı' : 'silindi';

    // Eski davranış: kanala embed gönder
    await interaction.deferReply({ ephemeral: true }); // sadece "komut alındı" için
    const post = (embed) => channel.send({ embeds: [embed] });

    await post(baseEmbed(guild, COLORS.start,
      mode === 'ac' ? 'KANALLAR KURULUYOR…' : 'KANALLAR SİLİNİYOR…'
    ));

    for (const step of PLAN) {
      if (mode === 'ac') {
        await createIfNotExists(guild, step);
      } else {
        // komutun yazıldığı kanalı yanlışlıkla silmeyelim
        await deleteIfExists(guild, step, channel.id);
      }
      await post(baseEmbed(guild, step.color,
        step.successText.replace('{AKSİYON}', AKSIYON)
      ));
    }

    await post(baseEmbed(guild, COLORS.done,
      mode === 'ac' ? 'Kurulumlar Tamamlandı (AÇIK).' : 'Tüm log kanalları silindi (KAPALI).'
    ));

    // ephemeral "komut alındı" mesajını sessizce sil
    await interaction.deleteReply().catch(() => {});
  }
};