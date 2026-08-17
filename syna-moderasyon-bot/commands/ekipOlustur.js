const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");
const config = require('../config.json');
const fs = require("fs");
const path = require("path");

const EKIPLER_PATH = path.join(__dirname, "..", "ekipler.json");
const CONFIG_PATH = path.join(__dirname, "..", "config.json");
const BLACKLIST_PATH = path.join(__dirname, "..", "blacklist.json");

module.exports = {
data: new SlashCommandBuilder()
  .setName("ekip")
  .setDescription("Ekip sistemini yönetir.")
  .addSubcommand(sub =>
    sub
      .setName("oluştur")
      .setDescription("Bir ekip oluşturmanı sağlar!")
      .addStringOption(option =>
        option.setName("isim").setDescription("Ekip adı").setRequired(true)
      )
      .addUserOption(option =>
        option.setName("boss").setDescription("Ekip bossu").setRequired(true)
      )
      .addIntegerOption(option =>
        option.setName("sınır")
          .setDescription("Ekip üye sınırı (max 100)")
          .setMinValue(1)
          .setMaxValue(100)
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName("renk").setDescription("Rol rengi (örn: kırmızı, mavi, yeşil, sarı)")
      )
  )
  .addSubcommand(sub =>
    sub
      .setName("bilgi")
      .setDescription("Bir ekibin bilgilerini gösterir.")
      .addIntegerOption(option =>
        option.setName("id").setDescription("Ekip ID seçin").setAutocomplete(true).setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName("üye-ekle")
      .setDescription("Bir ekibe kullanıcı ekler.")
      .addIntegerOption(option =>
        option.setName("id").setDescription("Ekip ID’si").setRequired(true)
      )
      .addUserOption(option =>
        option.setName("kullanıcı").setDescription("Ekibe eklenecek kullanıcı").setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName("üye-çıkart")
      .setDescription("Bir ekipten kullanıcı çıkartır.")
      .addIntegerOption(option =>
        option.setName("id").setDescription("Ekip ID’si").setRequired(true)
      )
      .addUserOption(option =>
        option.setName("kullanıcı").setDescription("Çıkartılacak kullanıcı").setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName("liste")
      .setDescription("Bir ekibin üyelerini listeler.")
      .addIntegerOption(option =>
        option.setName("id").setDescription("Ekip ID’si").setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName("kapat")
      .setDescription("Bir ekibi kapatır.")
      .addIntegerOption(option =>
        option.setName("id").setDescription("Kapatılacak ekip ID’si").setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName("fix")
      .setDescription("Ekiplerdeki eStik rol/kanalları düzeltir.")
  ),

  async autocomplete(interaction) {
    if (interaction.options.getSubcommand() !== "bilgi") return;

    let ekipler = [];
    if (fs.existsSync(EKIPLER_PATH)) {
      ekipler = JSON.parse(fs.readFileSync(EKIPLER_PATH, "utf8"));
    }

    const focusedValue = interaction.options.getFocused();
    const filtered = ekipler
      .filter(
        e =>
          e.isim.toLowerCase().includes(focusedValue.toLowerCase()) ||
          e.id.toString().includes(focusedValue)
      )
      .slice(0, 25);

    await interaction.respond(
      filtered.map(e => ({
        name: `${e.isim} (ID: ${e.id})`,
        value: String(e.id)
      }))
    );
  },

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (!fs.existsSync(CONFIG_PATH)) {
      await interaction.reply({
        content: "⚠️ config.json bulunamadı.",
        ephemeral: true
      });
      return;
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    const yetkiliRolId = config.yetkiliRolId;
    const bossRoleId = config.bossRoleId || null; // ✅ burayı ekle


    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(yetkiliRolId)) {
      await interaction.reply({
        content: "⚠️ Bu komutu kullanmak için yetkin yok.",
        ephemeral: true
      });
      return;
    }

 /* ==================
   /ekip oluştur
================== */
if (sub === "oluştur") {
  let ekipler = [];
  if (fs.existsSync(EKIPLER_PATH)) {
    ekipler = JSON.parse(fs.readFileSync(EKIPLER_PATH, "utf8"));
  }

  const ekipIsmi = interaction.options.getString("isim");
  const boss = interaction.options.getUser("boss");
  const sınır = interaction.options.getInteger("sınır");
  const renk = interaction.options.getString("renk") || null;

  const renkMap = {
    kırmızı: "#FF0000",
    mavi: "#0000FF",
    yeşil: "#00FF00",
    sarı: "#FFFF00",
    turuncu: "#FFA500",
    mor: "#8A2BE2",
    pembe: "#FF69B4"
  };

  const rolRengi =
    renk && renkMap[renk.toLowerCase()]
      ? renkMap[renk.toLowerCase()]
      : "#5865F2";

  const ekipId =
    ekipler.length > 0 ? Math.max(...ekipler.map(e => e.id)) + 1 : 1;

  const onayEmbed = new EmbedBuilder()
    .setColor("#9dafb6")
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    .setDescription(
      `> Ekip açma işlemini onaylayıp onaylamadığınızı aşağıdaki buttonlardan birine tıklayarak belirtin.`
    )
    .setAuthor({
      name: interaction.user.username,
      iconURL: interaction.user.displayAvatarURL({ dynamic: true })
    })
    .setFooter({
      text: `${config.brandFooter.split(' | ')[0]} | Ekip Sistemi.`,
      iconURL: config.logo
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(
        `ekip_onayla_${ekipId}_${boss.id}_${sınır}_${rolRengi}_${encodeURIComponent(
          ekipIsmi
        )}`
      )
      .setEmoji("<:1145673593171214337:1414746633622519879>")
      .setLabel("Onaylıyorum")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`ekip_red_${ekipId}`)
      .setEmoji("<:1145673595964629023:1414746591570563172>")
      .setLabel("Onaylamıyorum")
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({
    embeds: [onayEmbed],
    components: [row],
    ephemeral: false
  });

  // <:13899754306013758771:1414619305445691473> Rol kurma, json yazma kaldırıldı!
  // Bunlar artık butona basılınca yapılacak (interactionCreate.js içinde)
}


    /* ==================
       /ekip bilgi
    ================== */
    if (sub === "bilgi") {
      await interaction.deferReply();

      if (!fs.existsSync(EKIPLER_PATH)) {
        return interaction.editReply({
          content: "⚠️ Hiç ekip bulunamadı."
        });
      }

      const ekipler = JSON.parse(fs.readFileSync(EKIPLER_PATH, "utf8"));
      const whitelistRolId = config.whitelistRolId;

      const ekipId = interaction.options.getInteger("id");
      const ekip = ekipler.find(e => e.id === ekipId);
      if (!ekip) {
        return interaction.editReply({
          content: "⚠️ Böyle bir ekip bulunamadı."
        });
      }

      const guild = interaction.guild;
      const rol = guild.roles.cache.get(ekip.rol);
      const kanal = guild.channels.cache.get(ekip.kanal);
      const boss = await guild.members.fetch(ekip.boss).catch(() => null);

      // ✅ Boss'a rolü tekrar ver (garanti olsun)
      if (boss) {
        if (rol) await boss.roles.add(rol).catch(() => null);
        if (bossRoleId) await boss.roles.add(bossRoleId).catch(() => null);
      }

      let uyelerListesi = "Ekipte üye bulunmuyor.";
      if (rol) {
        const uyeler = (await guild.members.fetch()).filter(m =>
          m.roles.cache.has(rol.id)
        );
        if (uyeler.size > 0) {
          uyelerListesi = uyeler
            .map(m =>
              m.roles.cache.has(whitelistRolId)
                ? `+ ${m.displayName}`
                : `- ${m.displayName}`
            )
            .join("\n");
        }
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setThumbnail(interaction.user.displayAvatarURL())
        .setDescription(
          `${boss} ekibinin bilgileri aşağıda belirtilmiştir.\n\n` +
            `<:1149250145154781287:1413343677258006569> **Ekip İsmi:** ${ekip.isim}\n` +
            `<:1149250145154781287:1413343677258006569> **Ekip Rol İsmi:** ${
              rol ? rol.name : "<:13899754306013758771:1414619305445691473> Rol bulunamadı"
            }\n` +
            `<:1149250145154781287:1413343677258006569> **Ekip Kanalı:** ${
              kanal ? kanal : "<:13899754306013758771:1414619305445691473> Kanal bulunamadı"
            }\n` +
            `<:1149250145154781287:1413343677258006569> **Ekip Bossu:** ${
              boss ? boss : "<:13899754306013758771:1414619305445691473> Boss bulunamadı"
            }\n` +
             `<:1149250145154781287:1413343677258006569> **Ekip Rol ID:** ${ 
      rol ? `<@&${rol.id}>` : "<:13899754306013758771:1414619305445691473> Rol bulunamadı"
    }\n` +
            `<:1149250145154781287:1413343677258006569> **Ekip Üyeleri:**\n\`\`\`diff\n${uyelerListesi}\n\`\`\`\n` +
            `> Ekip Üyeleri kısmındaki ismin başında **+** olanlar whitelist rolüne sahip kişiler, diğerleri ise whitelistte olmayan kişilerdir.`
        )
        .setColor("#3498db")
        .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Ekip Sistemi.`, iconURL: config.logo });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ekip_yasakla_${ekip.id}`)
          .setLabel("Ekip Yasakla")
          .setEmoji("<:bannedalvar:1416451495792214016>")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`ekip_yasakac_${ekip.id}`)
          .setLabel("Ekip Yasak Aç")
          .setEmoji("<:bannedalvar:1416451495792214016>")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`ekip_whitelist_${ekip.id}`)
          .setLabel("Ekip Whitelist")
          .setEmoji("<:1249678270862069780:1408509202594398218>")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`ekip_whitelistal_${ekip.id}`)
          .setLabel("Ekip Whitelist Al")
          .setEmoji("<:1249678270862069780:1408509202594398218>")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`ekip_blacklist_${ekip.id}`)
          .setLabel("Ekip Blacklist")
          .setEmoji("<:bannedalvar:1416451495792214016>")
          .setStyle(ButtonStyle.Danger)
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ekip_blacklistac_${ekip.id}`)
          .setLabel("Ekip Blacklist Aç")
          .setEmoji("<:bannedalvar:1416451495792214016>")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.editReply({ embeds: [embed], components: [row, row2] });
    }

/* ==================
   /ekip fix
================== */
if (sub === "fix") {
  await interaction.deferReply();

  if (!fs.existsSync(EKIPLER_PATH)) {
    await interaction.editReply("⚠️ ekipler.json bulunamadı.");
    return;
  }

  let ekipler = JSON.parse(fs.readFileSync(EKIPLER_PATH, "utf8"));
  const guild = interaction.guild;

  const atlanan = [];
  const olusturulan = [];

  for (const ekip of ekipler) {
    let rol = guild.roles.cache.get(ekip.rol);
    let kanal = guild.channels.cache.get(ekip.kanal);
    let yenidenKuruldu = false;

    // ==================
    // Rol kontrol
    // ==================
    if (!rol) {
      rol = await guild.roles.create({
        name: ekip.isim,
        color: ekip.renk || "#5865F2",
        reason: `Ekip fix: Rol yeniden oluşturuldu (${ekip.isim})`
      }).catch(() => null);

      if (rol) {
        ekip.rol = rol.id;
        yenidenKuruldu = true;
      }
    }

    // ==================
    // Kanal kontrol
    // ==================
    if (!kanal) {
      kanal = await guild.channels.create({
        name: `👥・${ekip.isim}`,
        type: 0,
        parent: guild.channels.cache.get(config.ekipKategoriId) || null,
        permissionOverwrites: [
          { id: guild.id, deny: ["ViewChannel"] },
          { id: ekip.boss, allow: ["ViewChannel", "ManageChannels"] }
        ]
      }).catch(() => null);

      if (kanal) {
        ekip.kanal = kanal.id;
        yenidenKuruldu = true;
      }
    }

    // Rol tekrar dağıtımı (boss + kanal üyeleri)
    if (rol) {
      const boss = await guild.members.fetch(ekip.boss).catch(() => null);
      if (boss && !boss.roles.cache.has(rol.id)) {
        await boss.roles.add(rol).catch(() => {});
      }
      if (kanal) {
        for (const member of kanal.members.values()) {
          if (!member.roles.cache.has(rol.id)) {
            await member.roles.add(rol).catch(() => {});
          }
        }
      }
    }

    if (yenidenKuruldu) {
      olusturulan.push(`${ekip.isim} (ID: ${ekip.id})`);
    } else {
      atlanan.push(`${ekip.isim} (ID: ${ekip.id})`);
    }
  }

  fs.writeFileSync(EKIPLER_PATH, JSON.stringify(ekipler, null, 2));

  // ==================
  // Tek diff code block formatı
  // ==================
  let lines = [];
  lines.push(`${olusturulan.length} ekip yeniden oluşturuldu!`);
  lines.push("");
  lines.push("Atlanan Ekipler:");
  atlanan.forEach(e => lines.push(`- ${e}`));
  lines.push("");
  lines.push("Oluşturulan Ekipler:");
  olusturulan.forEach(e => lines.push(`+ ${e}`));

  const msg = "```diff\n" + lines.join("\n") + "\n```";

  await interaction.editReply(msg);
}



    /* ==================
       /ekip üye-ekle
    ================== */
    if (sub === "üye-ekle") {
      await interaction.deferReply({ ephemeral: true });

      if (!fs.existsSync(EKIPLER_PATH)) {
        return interaction.editReply({ content: "⚠️ Hiç ekip bulunamadı." });
      }

      const ekipler = JSON.parse(fs.readFileSync(EKIPLER_PATH, "utf8"));
      const targetUser = interaction.options.getUser("kullanıcı");
      const ekipId = interaction.options.getInteger("id");
      const ekip = ekipler.find(e => e.id === ekipId);

      if (!ekip) {
        return interaction.editReply({
          content: "⚠️ Böyle bir ekip bulunamadı."
        });
      }

      const guild = interaction.guild;
      const rol = guild.roles.cache.get(ekip.rol);
      const memberToAdd = await guild.members.fetch(targetUser.id).catch(() => null);

      if (!rol || !memberToAdd) {
        return interaction.editReply({
          content: "⚠️ Rol veya kullanıcı bulunamadı."
        });
      }

      await memberToAdd.roles.add(rol);
      return interaction.editReply({
        content: `${targetUser} başarıyla **${ekip.isim}** ekibine eklendi.`
      });
    }

    /* ==================
       /ekip üye-çıkart
    ================== */
    if (sub === "üye-çıkart") {
      await interaction.deferReply({ ephemeral: true });

      if (!fs.existsSync(EKIPLER_PATH)) {
        return interaction.editReply({ content: "⚠️ Hiç ekip bulunamadı." });
      }

      const ekipler = JSON.parse(fs.readFileSync(EKIPLER_PATH, "utf8"));
      const targetUser = interaction.options.getUser("kullanıcı");
      const ekipId = interaction.options.getInteger("id");
      const ekip = ekipler.find(e => e.id === ekipId);

      if (!ekip) {
        return interaction.editReply({
          content: "⚠️ Böyle bir ekip bulunamadı."
        });
      }

      const guild = interaction.guild;
      const rol = guild.roles.cache.get(ekip.rol);
      const memberToRemove = await guild.members.fetch(targetUser.id).catch(() => null);

      if (!rol || !memberToRemove) {
        return interaction.editReply({
          content: "⚠️ Rol veya kullanıcı bulunamadı."
        });
      }

      if (!memberToRemove.roles.cache.has(rol.id)) {
        return interaction.editReply({
          content: "⚠️ Bu kullanıcı zaten bu ekipte değil."
        });
      }

      await memberToRemove.roles.remove(rol);
      return interaction.editReply({
        content: `${targetUser} başarıyla **${ekip.isim}** ekibinden çıkartıldı.`
      });
    }

    /* ==================
       /ekip liste
    ================== */
    if (sub === "liste") {
      await interaction.deferReply();

      if (!fs.existsSync(EKIPLER_PATH)) {
        await interaction.editReply({ content: "⚠️ Hiç ekip bulunamadı." });
        return;
      }

      const ekipler = JSON.parse(fs.readFileSync(EKIPLER_PATH, "utf8"));
      const ekipId = interaction.options.getInteger("id");
      const ekip = ekipler.find(e => e.id === ekipId);

      if (!ekip) {
        await interaction.editReply({ content: "⚠️ Böyle bir ekip bulunamadı." });
        return;
      }

      const guild = interaction.guild;
      const rol = guild.roles.cache.get(ekip.rol);
      const boss = await guild.members.fetch(ekip.boss).catch(() => null);

      let uyeler = [];
      if (rol) {
        uyeler = (await guild.members.fetch())
          .filter(m => m.roles.cache.has(rol.id))
          .map(m => m.displayName);
      }

      if (uyeler.length === 0) {
        await interaction.editReply({ content: "⚠️ Ekipte hiç üye bulunmuyor." });
        return;
      }

      let sayfa = 0;
      const sayfaBoyutu = 40;
      const toplamSayfa = Math.ceil(uyeler.length / sayfaBoyutu);

      const renderEmbed = (index) => {
        const baslangic = index * sayfaBoyutu;
        const bitis = baslangic + sayfaBoyutu;
        const liste = uyeler.slice(baslangic, bitis);

        let desc = `${boss} ekibinin üyeleri aşağıda belirtilmiştir.\n\n`;
        desc += `✨ **Ekip ID:** ${ekip.id}\n`;
        desc += `✨ **Ekip İsmi:** ${ekip.isim}\n`;
        desc += `✨ **Ekip Bossu:** ${boss}\n\n`;

        if (liste.length > 0) {
          desc += "**Ekip Üyeleri:**\n```diff\n";
          desc += liste.map(u => `+ ${u}`).join("\n");
          desc += "\n```";
        }

        if (index + 1 === toplamSayfa && uyeler.length > 40) {
          desc += `\n⚠️ 40'dan fazla üye olduğu için /rol bilgi komutunu kullanın.`;
        }

        return new EmbedBuilder()
          .setColor("#2ecc71")
          .setTitle(`${ekip.isim} - Ekip Listesi`)
          .setDescription(desc)
          .setFooter({ text: `Sayfa ${index + 1}/${toplamSayfa}` });
      };

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("geri")
          .setLabel("⬅️")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("ileri")
          .setLabel("➡️")
          .setStyle(ButtonStyle.Secondary)
      );

      const msg = await interaction.editReply({
        embeds: [renderEmbed(sayfa)],
        components: [row]
      });

      const collector = msg.createMessageComponentCollector({ time: 60000 });

      collector.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
          await i.reply({ content: "⚠️ Bu buton sana ait değil.", ephemeral: true });
          return;
        }

        await i.deferUpdate().catch(() => {});

        if (i.customId === "geri") {
          sayfa = sayfa > 0 ? sayfa - 1 : toplamSayfa - 1;
        } else if (i.customId === "ileri") {
          sayfa = sayfa + 1 < toplamSayfa ? sayfa + 1 : 0;
        }

        await i.editReply({ embeds: [renderEmbed(sayfa)], components: [row] });
      });
      

      collector.on("end", async () => {
        await msg.edit({ components: [] }).catch(() => {});
      });
    }

/* ==================
   /ekip kapat
================== */
if (sub === "kapat") {
  await interaction.deferReply({ ephemeral: false });

  if (!fs.existsSync(EKIPLER_PATH)) {
    await interaction.editReply({ content: "⚠️ Hiç ekip bulunamadı." });
    return;
  }

  let ekipler = JSON.parse(fs.readFileSync(EKIPLER_PATH, "utf8"));
  const ekipId = interaction.options.getInteger("id");
  const ekip = ekipler.find(e => e.id === ekipId);

  if (!ekip) {
    await interaction.editReply({ content: "⚠️ Böyle bir ekip bulunamadı." });
    return;
  }

  const guild = interaction.guild;
  const rol = guild.roles.cache.get(ekip.rol);
  const kanal = guild.channels.cache.get(ekip.kanal);

  // 🔥 Rol varsa sil
  if (rol) {
    await rol.delete("Ekip kapatıldı.").catch(() => {});
  }

  // 🔥 Kanal varsa sil
  if (kanal) {
    await kanal.delete("Ekip kapatıldı.").catch(() => {});
  }

  // JSON’dan ekibi kaldır
  ekipler = ekipler.filter(e => e.id !== ekipId);
  fs.writeFileSync(EKIPLER_PATH, JSON.stringify(ekipler, null, 2));

  const embed = new EmbedBuilder()
    .setColor("#e74c3c")
    .setTitle("<:13899754306013758771:1414619305445691473> Ekip Kapatıldı")
    .setDescription(
      `**${ekip.isim}** ekibi başarıyla kapatıldı, rol ve kanal silindi ve sistemden kaldırıldı.`
    )
    .setFooter({ text: `${config.brandFooter.split(' | ')[0]} | Ekip Sistemi.`, iconURL: config.logo });

  await interaction.editReply({ embeds: [embed] });
}
  }
};
