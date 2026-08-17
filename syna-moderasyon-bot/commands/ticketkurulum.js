const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  AttachmentBuilder,
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const config = require("../config.json");
const log = require("../log.json");

// Web sitenizin API endpoint'i
const WEBSITE_API_URL = 'https://seabots.com.tr/api/ticket-transcript';



// HTML Transcript oluşturma fonStiyonu
async function createHTMLTranscript(channel) {
  try {
    const messages = [];
    let lastMessageId = null;
    
    // Tüm mesajları topla
    while (true) {
      const fetchedMessages = await channel.messages.fetch({ 
        limit: 100, 
        before: lastMessageId 
      });
      
      if (fetchedMessages.size === 0) break;
      
      messages.push(...fetchedMessages.values());
      lastMessageId = fetchedMessages.last().id;
    }
    
    // Mesajları ters çevir (eski → yeni)
    messages.reverse();
    
    // Kullanıcı profillerini oluştur
    const profiles = {};
    messages.forEach(msg => {
      if (!profiles[msg.author.id]) {
        profiles[msg.author.id] = {
          author: msg.author.username,
          avatar: msg.author.displayAvatarURL({ size: 64 }),
          bot: msg.author.bot,
          verified: false
        };
      }
    });
    
    // HTML oluştur (Discord transcript formatında - tek satır)
    const html = `<html><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="icon" type="image/png" href="https://cdn.discordapp.com/icons/1392876861645783212/ad1c820218bed3a75e4d724cea53eff0.png?size=16"/><title>${channel.name}</title><script>document.addEventListener("click",t=>{let e=t.target;if(!e)return;let o=e?.getAttribute("data-goto");if(o){let r=document.getElementById(\`m-\${o}\`);r?(r.scrollIntoView({behavior:"smooth",block:"center"}),r.style.backgroundColor="rgba(148, 156, 247, 0.1)",r.style.transition="background-color 0.5s ease",setTimeout(()=>{r.style.backgroundColor="transparent"},1e3)):console.warn("Message not found.")}});</script><script>window.$discordMessage={profiles:${JSON.stringify(profiles)}}}</script><script type="module" src="https://cdn.jsdelivr.net/npm/@derockdev/discord-components-core@^3.6.1/dist/derockdev-discord-components-core/derockdev-discord-components-core.esm.js"></script></head><body style="margin:0;min-height:100vh"><discord-messages style="min-height:100vh"><discord-header guild="${channel.guild.name}" channel="${channel.name}" icon="${channel.guild.iconURL({ size: 128 })}">${messages[0]?.author.id || ''}</discord-header>${messages.map(msg => {
      const timestamp = msg.createdAt.toISOString();
      const content = msg.content || '';
      const mentions = content.match(/<@!?(\d+)>/g) || [];
      let processedContent = content;
      mentions.forEach(mention => {
        const userId = mention.match(/<@!?(\d+)>/)[1];
        const user = channel.guild.members.cache.get(userId);
        if (user) {
          processedContent = processedContent.replace(mention, `<discord-mention type="user">${user.user.username}</discord-mention>`);
        }
      });
      let embedContent = '';
      if (msg.embeds && msg.embeds.length > 0) {
        embedContent = msg.embeds.map(embed => {
          let embedHtml = `<discord-embed embed-title="${embed.title || ''}" slot="embeds" color="${embed.color || '#5865f2'}"`;
          if (embed.thumbnail) embedHtml += ` thumbnail="${embed.thumbnail.url}"`;
          if (embed.image) embedHtml += ` image="${embed.image.url}"`;
          embedHtml += '>';
          if (embed.description) {
            embedHtml += `<discord-embed-description slot="description">${embed.description}</discord-embed-description>`;
          }
          if (embed.fields && embed.fields.length > 0) {
            embedHtml += '<discord-embed-fields slot="fields">';
            embed.fields.forEach(field => {
              embedHtml += `<discord-embed-field field-title="${field.name}" inline="${field.inline}">${field.value}</discord-embed-field>`;
            });
            embedHtml += '</discord-embed-fields>';
          }
          if (embed.footer) {
            embedHtml += `<discord-embed-footer slot="footer"${embed.footer.iconURL ? ` footer-image="${embed.footer.iconURL}"` : ''}>${embed.footer.text}</discord-embed-footer>`;
          }
          embedHtml += '</discord-embed>';
          return embedHtml;
        }).join('');
      }
      let attachmentContent = '';
      if (msg.attachments && msg.attachments.size > 0) {
        attachmentContent = '<discord-attachments slot="components">';
        msg.attachments.forEach(attachment => {
          attachmentContent += `<discord-attachment slot="attachment" url="${attachment.url}" filename="${attachment.name}"></discord-attachment>`;
        });
        attachmentContent += '</discord-attachments>';
      }
      return `<discord-message id="m-${msg.id}" timestamp="${timestamp}" edited="false" highlight="false" profile="${msg.author.id}">${processedContent}${embedContent}${attachmentContent}</discord-message>`;
    }).join('')}<div style="text-align:center;width:100%">Ticketta ${messages.length} Mesaj var </div></discord-messages></body></html>`;
    
    return html;
  } catch (error) {
    console.error("HTML transcript oluşturma hatası:", error);
    return null;
  }
}

// ──────────────────────────── PERSIST HELPERS ────────────────────────────
const DATA_DIR = path.join(__dirname, "..", "data");
const COUNTER_PATH = path.join(DATA_DIR, "ticketcounter.json");
const PANEL_PATH = path.join(DATA_DIR, "ticketpanel.json");
const META_PATH = path.join(DATA_DIR, "ticketmeta.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function readJSON(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[ticket] JSON yazılamadı:", filePath, e);
  }
}
function loadStoreFromDisk() {
  ensureDataDir();
  const tc = readJSON(COUNTER_PATH, { counter: 0, activeByUser: {}, userOpenCounts: {} });
  const meta = readJSON(META_PATH, {});
  return {
    counter: Number(tc.counter) || 0,
    activeByUser: new Map(Object.entries(tc.activeByUser || {})),
    userOpenCounts: new Map(Object.entries(tc.userOpenCounts || {}).map(([k, v]) => [k, Number(v) || 0])),
    ticketMeta: new Map(Object.entries(meta)),
  };
}
function persistCounterLike(store) {
  const payload = {
    counter: store.counter,
    activeByUser: Object.fromEntries(store.activeByUser.entries()),
    userOpenCounts: Object.fromEntries(store.userOpenCounts.entries()),
  };
  writeJSON(COUNTER_PATH, payload);
}
function persistMeta(store) {
  const payload = Object.fromEntries(store.ticketMeta.entries());
  writeJSON(META_PATH, payload);
}
function savePanel(guildId, channelId, messageId) {
  writeJSON(PANEL_PATH, { guildId, channelId, messageId });
}
function loadPanel() {
  return readJSON(PANEL_PATH, null);
}

// ──────────────────────────── HELPERS ────────────────────────────
function kategoriBaslik(v) {
  return v === "tech"
    ? "Destek, Bug & Teknik Sorunlar"
    : v === "ing"
    ? "Oyun içi Sorunlar & Rol Hataları"
    : v === "donate"
    ? "Donate Satın alım"
    : "Diğer Kategoriler";
}
function getOpenerFromStore(channel, store) {
  for (const [uid, cid] of store.activeByUser.entries())
    if (cid === channel.id) return uid;
  return null;
}
async function isStaff(i) {
  const r = i.guild.roles.cache.find((x) => x.name.toLowerCase() === "yetkili ekibi");
  if (!r) return true;
  const m = await i.guild.members.fetch(i.user.id);
  const ok = m.roles.cache.has(r.id);
  if (!ok) i.reply({ content: "Bu işlemi sadece **Yetkili Ekibi** kullanabilir.", ephemeral: true });
  return ok;
}

// ──────────────────────────── KOMUT ────────────────────────────
module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticketkurulum")
    .setDescription("Ticket panelini kanala kurar."),

  async execute(interaction, client) {
    // Sadece belirli kullanıcı ID'si kullanabilir
    if (config.Synatx && interaction.user.id !== config.Synatx) {
      return interaction.reply({ content: '<:13899754306013758771:1414619305445691473> Bu komutu sadece **Synatx** kullanabilir!', ephemeral: true });
    }

    if (!client.ticketStore) client.ticketStore = loadStoreFromDisk();
    const store = client.ticketStore;

    await interaction.deferReply({ ephemeral: true }).catch(() => {});
    setTimeout(() => interaction.deleteReply().catch(() => {}), 150);

    const panel = new EmbedBuilder()
      .setColor("#92c8dd")
      .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
      .setTitle("Destek Sistemi")
      .setURL(config.url)
      .setDescription([
        "<:1149250145154781287:1413343677258006569> **Destek Sistemi Hakkında:**",
        "Aşağıdaki seçeneklerden uygun olanı seçerek hemen bir ticket oluşturabilirsiniz.",
        "",
        "<:1146375638941450250:1413343679006900385> **Sunucu Bilgisi:**",
        "Sunucumuzun kurallarını okumayı unutmayın.",
      ].join("\n"))
      .setThumbnail(config.logo)
      .setImage(config.banner)
      .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Ticket Sistemi.`, iconURL: config.logo });

    const menu = new StringSelectMenuBuilder()
      .setCustomId("tk:menu")
      .setPlaceholder("Ticket Açmak İçin Kategori Seçiniz.")
      .addOptions(
        { label: "Destek, Bug & Teknik Sorunlar", emoji: "<a:1187135503515013160:1413345639550681089> ", value: "tech" },
        { label: "Oyun içi Sorunlar & Rol Hataları", emoji: "<a:1187139727908937809:1413345628016087121> ", value: "ing" },
        { label: "Donate Satın alım", emoji: "<:1322683863368990831:1413345650589827082> ", value: "donate" },
        { label: "Diğer Kategoriler", emoji: "<a:1187141486819688448:1413345682902880448> ", value: "other" },
        { label: "Seçenek Sıfırla", emoji: "<:1187142302548889780:1413345834048819270> ", value: "reset" },
      );

    const sent = await interaction.channel.send({
      embeds: [panel],
      components: [new ActionRowBuilder().addComponents(menu)],
    });

    savePanel(interaction.guild.id, interaction.channel.id, sent.id);
    attachHandlers(client, store);
  },
};

// ──────────────────────────── HANDLERS ────────────────────────────
async function attachHandlers(client, store) {
  // Eğer handler zaten eklenmişse, tekrar ekleme
  if (client.ticketHandlerAdded) return;
  client.ticketHandlerAdded = true;

  // Ticket interaction handler'ı ekle
  client.on("interactionCreate", async (i) => {
    try {
      // Debug: Ticket interaction'ları logla
      if (i.customId && i.customId.startsWith("tk:")) {
        console.log(`[TICKET] Interaction: ${i.customId} - User: ${i.user.tag}`);
      }
      
    // SELECT: TICKET AÇ
    if (i.isStringSelectMenu() && i.customId === "tk:menu") {
      if (i.values[0] === "reset") {
        return i.reply({ content: "✅ Seçenek sıfırlandı.", ephemeral: true });
      }

      const kategori = i.values[0];
      const openerId = i.user.id;
      
      // Kullanıcının zaten açık ticket'ı var mı kontrol et
      if (store.activeByUser.has(openerId)) {
        const existingChannelId = store.activeByUser.get(openerId);
        const existingChannel = i.guild.channels.cache.get(existingChannelId);
        if (existingChannel) {
          return i.reply({ 
            content: `<:13899754306013758771:1414619305445691473> Zaten açık bir ticket'ınız var: ${existingChannel}`, 
            ephemeral: true 
          });
        } else {
          // Eğer kanal silinmişse store'dan temizle
          store.activeByUser.delete(openerId);
        }
      }

      // Ticket sayısını artır
      store.counter++;
      const ticketNumber = store.counter;
      const channelName = `┇${ticketNumber}┇${i.user.username}`;

      // Kategori kontrolü
      let categoryId = config.ticketKategoriId;
      if (!categoryId) {
        return i.reply({ 
          content: "<:13899754306013758771:1414619305445691473> Ticket kategorisi bulunamadı. Lütfen yönetici ile iletişime geçin.", 
          ephemeral: true 
        });
      }

      // Ticket kanalı oluştur
      const ticketChannel = await i.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites: [
          {
            id: i.guild.roles.everyone.id,
            deny: ["ViewChannel"]
          },
          {
            id: openerId,
            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
          }
        ]
      });

      // Store'a ekle
      store.activeByUser.set(openerId, ticketChannel.id);
      store.ticketMeta.set(ticketChannel.id, {
        opener: openerId,
        category: kategori,
        createdAt: Date.now()
      });

      // Persist et
      persistCounterLike(store);
      persistMeta(store);

      // Ticket embed'i
      const ticketEmbed = new EmbedBuilder()
        .setColor("#2f3136")
        .setTitle(`${kategoriBaslik(kategori)} Kategorili Destek!`)
        .setDescription([
          `> ${i.user} kişisi <t:${Math.floor(Date.now() / 1000)}:R> tarihinde destek talebi oluşturdu.`,
          "",
          "Oluşturulan destek talebinin bilgilerini aşağıda belirttim;"
        ].join("\n"))
        .addFields(
          {
            name: "Oluşturan Kullanıcı:",
            value: `\`\`\`fix\n${i.user.username}\n\`\`\``,
            inline: false
          },
          {
            name: "Kategori:",
            value: `\`\`\`fix\n${kategoriBaslik(kategori)}\n\`\`\``,
            inline: false
          },
          {
            name: "Durum",
            value: `\`\`\`fix\n🔴 - Yetkili Bekliyor\n\`\`\``,
            inline: false
          }
        )
        .setThumbnail(i.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ 
          text: "Synatx Bot's | Ticket Sistemi",
          iconURL: "https://media.discordapp.net/attachments/1159427615384412190/1282811725825048629/Favicon.png?ex=68e23744&is=68e0e5c4&hm=415680b2d10b9bde26153d8084839e2c0fa1eb78542c1903412f4d88b6bbeed4&" // Wrench emoji
        });

      // Butonlar
      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("tk:claim")
          .setLabel("Yetkili - Sahiplen")
          .setEmoji("👥")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("tk:close_staff")
          .setLabel("Yetkili - Kapat")
          .setEmoji("💾")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("tk:close_user")
          .setLabel("Oyuncu - Kapat")
          .setEmoji("⚙️")
          .setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({ 
        content: `<@${openerId}>`, 
        embeds: [ticketEmbed], 
        components: [buttons] 
      });


      await i.reply({ 
        content: `✅ Ticket başarıyla oluşturuldu: ${ticketChannel}`, 
        ephemeral: true 
      });
    }

    // BUTTON: YETKİLİ - SAHİPLEN
    if (i.isButton() && i.customId === "tk:claim") {
      console.log(`[TICKET] Claim button pressed by ${i.user.tag}`);
      const roleId = config.yetkiliRolId;
      const member = await i.guild.members.fetch(i.user.id);
      if (!member.roles.cache.has(roleId)) {
        return i.reply({ content: "<:13899754306013758771:1414619305445691473> Bu işlemi sadece Yetkili rolündekiler yapabilir.", ephemeral: true });
      }

      const ticketMsg = await i.channel.messages.fetch({ limit: 1 }).then((m) => m.first());
      if (!ticketMsg) return;

      const oldEmbed = ticketMsg.embeds[0];
      const newEmbed = EmbedBuilder.from(oldEmbed);
      
      // Durum field'ını güncelle
      const fields = oldEmbed.fields.map(field => {
        if (field.name === "Durum") {
          return {
            name: field.name,
            value: "```fix\n🟡 - Yetkili Sahiplendi\n```",
            inline: field.inline
          };
        }
        return field;
      });
      
      newEmbed.setFields(fields);

      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("tk:claim").setLabel("Yetkili - Sahiplen").setEmoji("👥").setStyle(ButtonStyle.Primary).setDisabled(true),
        new ButtonBuilder().setCustomId("tk:close_staff").setLabel("Yetkili - Kapat").setEmoji("💾").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("tk:close_user").setLabel("Oyuncu - Kapat").setEmoji("⚙️").setStyle(ButtonStyle.Danger),
      );

      await ticketMsg.edit({ embeds: [newEmbed], components: [disabledRow] });

      // Webhook mesajı (tek seferlik, claim yapanın adı + avatarıyla)
      const openerId = getOpenerFromStore(i.channel, store);
      const hook = await i.channel.createWebhook({
        name: i.user.username,
        avatar: i.user.displayAvatarURL(),
      });
      await hook.send({ content: `<@${openerId}> Selam ben ${i.user.tag}, size nasıl yardımcı olabilirim?` });
      await hook.delete();

      // Ticket sahiplenildi mesajını kanala gönder (görseldeki gibi)
      const meta = store.ticketMeta.get(i.channel.id);
      const ticketCreatedAt = meta.createdAt;
      const timeToClaimInSeconds = Math.floor((Date.now() - ticketCreatedAt) / 1000);

      const claimEmbed = new EmbedBuilder()
        .setTitle(`Destek talebi <@${openerId}> tarafından sahiplenildi!`)
        .setDescription(`**Destek talebi <@${openerId}> tarafından sahiplenildi!**\n\n> Talep <t:${Math.floor(ticketCreatedAt / 1000)}:R> açıldı ve ${timeToClaimInSeconds} saniye içinde sahiplenildi.`)
        .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Ticket Sistemi.`, iconURL: config.logo });

      await i.channel.send({ embeds: [claimEmbed] });

      // Log kanalına gönder
      const log = require("../log.json");
      const logChannel = i.guild.channels.cache.get(log["Stticket-yetkili-log"]);
      if (logChannel) {
        const opener = await i.guild.members.fetch(openerId);
        const now = Math.floor(Date.now() / 1000);
        
        const logEmbed = new EmbedBuilder()
          .setTitle("Ticket Sahiplenildi")
          .setDescription(
            `> <@${openerId}> adlı kullanıcıya ait destek talebi <@${i.user.id}> tarafından sahiplenildi!`
          )
          .addFields(
            {
              name: "Ticket Sahibi:",
              value: `<@${openerId}> - ${openerId}`,
              inline: false
            },
            {
              name: "Ticketi Sahiplenen Yetkili:",
              value: `<@${i.user.id}> - ${i.user.id}`,
              inline: false
            },
            {
              name: "Sahiplenilen Kanal:",
              value: `<#${i.channel.id}> - ${i.channel.id}`,
              inline: false
            },
            {
              name: "Zaman:",
              value: `<t:${now}:F> (<t:${now}:R>)`,
              inline: false
            }
          )
          .setColor("#3d3e42")
          .setThumbnail(i.client.user.displayAvatarURL({ dynamic: true }))
          .setFooter({
            text: "Synatx Bot's | Log Sistemi.",
            iconURL: i.client.user.displayAvatarURL({ dynamic: true })
          });

        await logChannel.send({ embeds: [logEmbed] });
      }

    }

    // BUTTON: YETKİLİ - KAPAT
    if (i.isButton() && i.customId === "tk:close_staff") {
      console.log(`[TICKET] Close staff button pressed by ${i.user.tag}`);
      const roleId = config.yetkiliRolId;
      const member = await i.guild.members.fetch(i.user.id);
      if (!member.roles.cache.has(roleId)) {
        return i.reply({ content: "<:13899754306013758771:1414619305445691473> Bu işlemi sadece Yetkili rolündekiler yapabilir.", ephemeral: true });
      }

      const openerId = getOpenerFromStore(i.channel, store);
      if (!openerId) return;

      // Store'dan kaldır
      store.activeByUser.delete(openerId);
      store.ticketMeta.delete(i.channel.id);
      persistCounterLike(store);
      persistMeta(store);


      // Log embed'i (görseldeki gibi)
      const logChannel = i.guild.channels.cache.get(log["Stticket-log"]);
      if (logChannel) {
          // Kullanıcı bilgisini al
          const openerUser = await i.guild.members.fetch(openerId).catch(() => null);
          const openerUsername = openerUser?.user?.username || 'Bilinmeyen';
          
          const logEmbed = new EmbedBuilder()
            .setAuthor({ name: `Ticket Adı: ${store.ticketCounter} | ${openerUsername}`, iconURL: i.user.displayAvatarURL() })
          .setDescription(
            `> **| Ticket bilgileri aşağıda belirtilmiştir;**`
          )
          .addFields(
            {
              name: "<a:1389975446560440482:1413636566185807963>  **Ticket'ı kapatan yetkili:**",
              value: `\`\`\`fix\n${i.user.username} | ${i.user.id}\n\`\`\``,
              inline: false
            },
            {
              name: "<:13917260748992021391:1413930672187375688> **Ticket sahibi:**",
              value: `\`\`\`fix\n${openerId}\n\`\`\``,
              inline: false
            },
            {
              name: "<a:13899754405501378661:1413636586830037125> **Ticket açılma sebebi:**",
              value: `\`\`\`fix\n${store.ticketMeta.get(i.channel.id)?.category || 'Bilinmeyen'}\n\`\`\``,
              inline: false
            },
            {
              name: "<a:1389975454496329728:1413636582300188862>   **Ticket açılma tarihi:**",
              value: `\`\`\`fix\n${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - ${Math.floor((Date.now() - (store.ticketMeta.get(i.channel.id)?.createdAt || Date.now())) / (1000 * 60 * 60 * 24))} gün önce\n\`\`\``,
              inline: false
            }
          )
          .setFooter({ 
            text: `${config.brandFooter.split(' | ')[0]} | Log Sistemi.. ${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`, 
            iconURL: config.logo 
          })
          .setColor("#3d3e42")
          .setThumbnail(openerUser?.user?.displayAvatarURL() || i.guild.iconURL());

        // Önce çizgi gönder
        await logChannel.send('----------------------------------------------------------');
        
        // Transcript butonu oluştur (sabit URL)
        const transcriptButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Transcript')
            .setStyle(ButtonStyle.Link)
            .setURL('https://seabots.com.tr/transcripts/')
        );
        
        await logChannel.send({ 
          embeds: [logEmbed], 
          components: [transcriptButton] 
        });
      }

      // Ephemeral mesaj
      await i.reply({ content: "Destek talebi kapatılıyor...", ephemeral: true });

      // 3 saniye sonra kanalı sil
      setTimeout(async () => {
        try {
          await i.channel.delete();
        } catch (e) {
          console.error("Ticket kanalı silinemedi:", e);
        }
      }, 3000);
    }

    // BUTTON: OYUNCU - KAPAT
    if (i.isButton() && i.customId === "tk:close_user") {
      console.log(`[TICKET] Close user button pressed by ${i.user.tag}`);
      const openerId = getOpenerFromStore(i.channel, store);
      if (!openerId || openerId !== i.user.id) {
        return i.reply({ content: "<:13899754306013758771:1414619305445691473> Bu ticket'ı sadece açan kişi kapatabilir.", ephemeral: true });
      }

      // Kullanıcının kanal erişimini kaldır
      await i.channel.permissionOverwrites.edit(openerId, {
        ViewChannel: false,
        SendMessages: false,
        ReadMessageHistory: false
      });

      // Ticket kapatıldı embed'i (görseldeki gibi)
      const closeEmbed = new EmbedBuilder()
        .setAuthor({
          name: i.user.username,
          iconURL: i.user.displayAvatarURL({ dynamic: true })
        })
        .setDescription(
          `@${i.user.username} adlı kişi destek talebini kapattı.\n\n` +
          `__${i.user.username} adlı kişi artık bu kanalı göremez!__`
        )
        .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Ticket Sistemi.`, iconURL: config.logo });

      // Ticket geri aç butonu
      const reopenButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("tk:reopen")
          .setLabel("Ticketi Geri aç")
          .setStyle(ButtonStyle.Success)
      );

      // İlk ticket embed'ini bul
      const messages = await i.channel.messages.fetch({ limit: 50 });
      const ticketMessage = messages.find(msg => 
        msg.embeds.length > 0 && 
        msg.embeds[0].title && 
        msg.embeds[0].title.includes("Kategorili Destek")
      );

      if (ticketMessage) {
        await ticketMessage.reply({ 
          content: `<@${openerId}>`, 
          embeds: [closeEmbed], 
          components: [reopenButton] 
        });
      } else {
        await i.channel.send({ 
          content: `<@${openerId}>`, 
          embeds: [closeEmbed], 
          components: [reopenButton] 
        });
      }

      await i.reply({ content: "✅ Ticket kapatıldı!", ephemeral: true });
    }

    // BUTTON: TICKET GERİ AÇ
    if (i.isButton() && i.customId === "tk:reopen") {
      console.log(`[TICKET] Reopen button pressed by ${i.user.tag}`);
      const roleId = config.yetkiliRolId;
      const member = await i.guild.members.fetch(i.user.id);
      if (!member.roles.cache.has(roleId)) {
        return i.reply({ content: "<:13899754306013758771:1414619305445691473> Bu işlemi sadece Yetkili rolündekiler yapabilir.", ephemeral: true });
      }

      // Ticket sahibini bul (store'dan)
      const openerId = getOpenerFromStore(i.channel, store);
      if (!openerId) {
        return i.reply({ content: "<:13899754306013758771:1414619305445691473> Ticket sahibi bulunamadı.", ephemeral: true });
      }

      // Kullanıcının kanal erişimini geri ver
      await i.channel.permissionOverwrites.edit(openerId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });

      // İlk embed'i bul ve butonunu devre dışı bırak
      const messages = await i.channel.messages.fetch({ limit: 10 });
      const closeMessage = messages.find(msg => 
        msg.embeds.length > 0 && 
        msg.embeds[0].description && 
        msg.embeds[0].description.includes("adlı kişi destek talebini kapattı")
      );

      if (closeMessage) {
        const disabledButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("tk:reopen")
            .setLabel("Ticketi Geri aç")
            .setStyle(ButtonStyle.Success)
            .setEmoji("🔄")
            .setDisabled(true)
        );

        await closeMessage.edit({ components: [disabledButton] });
      }

      // Ticket geri açıldı embed'i (2. görseldeki gibi)
      const reopenEmbed = new EmbedBuilder()
        .setAuthor({
          name: i.user.username,
          iconURL: i.user.displayAvatarURL({ dynamic: true })
        })
        .setDescription(
          `@${i.user.username} adlı Yetkili destek talebini Geri Açtı.`
        )
        .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Ticket Sistemi.`, iconURL: config.logo });

      // closeEmbed mesajını bul ve ona yanıt olarak gönder
      const messages2 = await i.channel.messages.fetch({ limit: 50 });
      const closeMessageForReply = messages2.find(msg => 
        msg.embeds.length > 0 && 
        msg.embeds[0].description && 
        msg.embeds[0].description.includes("adlı kişi destek talebini kapattı")
      );

      if (closeMessageForReply) {
        await closeMessageForReply.reply({ 
          content: `<@${openerId}>`, 
          embeds: [reopenEmbed] 
        });
      } else {
        await i.channel.send({ 
          content: `<@${openerId}>`, 
          embeds: [reopenEmbed] 
        });
      }

      await i.reply({ content: "✅ Ticket başarıyla geri açıldı!", ephemeral: true });
    }
    } catch (error) {
      console.error("Ticket interaction hatası:", error);
      if (!i.replied && !i.deferred) {
        try {
          await i.reply({ content: "<:13899754306013758771:1414619305445691473> Bir hata oluştu. Lütfen tekrar deneyin.", ephemeral: true });
        } catch (replyError) {
          console.error("Reply hatası:", replyError);
        }
      }
    }
  });
}

// ──────────────────────────── PANEL AUTOLOAD ────────────────────────────
module.exports.autoload = async function (client) {
  if (!client.ticketStore) client.ticketStore = loadStoreFromDisk();
  const store = client.ticketStore;
  const panel = loadPanel();
  
  if (!panel) {
    console.log("ℹ️ Ticket paneli bulunamadı - yeni panel oluşturulması gerekiyor.");
    return;
  }

  try {
    const guild = await client.guilds.fetch(panel.guildId);
    const ch = await guild.channels.fetch(panel.channelId);
    const message = await ch.messages.fetch(panel.messageId);
    
    // Mesajın hala var olduğunu ve doğru component'lere sahip olduğunu kontrol et
    if (message && message.components && message.components.length > 0) {
      attachHandlers(client, store);
      console.log("✅ Ticket paneli yeniden yüklendi ve handler'lar aktif edildi.");
    } else {
      console.log("⚠️ Ticket paneli mesajı bulundu ama component'ler eStik.");
    }
  } catch (e) {
    console.log("⚠️ Ticket paneli bulunamadı veya erişilemiyor:", e.message);
    // Panel bulunamadıysa, store'u temizle
    if (e.code === 10008 || e.code === 404) {
      console.log("🗑️ Eski panel verileri temizleniyor...");
      // Panel dosyasını sil
      if (fs.existsSync(PANEL_PATH)) {
        fs.unlinkSync(PANEL_PATH);
      }
    }
  }
};
