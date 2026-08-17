const {
  Events,
  EmbedBuilder,
  AttachmentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionsBitField
} = require("discord.js");
const fs = require("fs");
const path = require("path");

// Dosya yolları
const CONFIG_PATH = path.join(__dirname, "..", "config.json");
const EKIPLER_PATH = path.join(__dirname, "..", "ekipler.json");
const LOG_PATH = path.join(__dirname, "..", "log.json");
const BLACKLIST_PATH = path.join(__dirname, "..", "blacklist.json");

// Log ayarları
const log = JSON.parse(fs.readFileSync(LOG_PATH, "utf8"));
const LOG_CHANNEL_ID = log["Stcommand-log"]; // Komut log kanalı
const BASVURU_LOG_CHANNEL_ID = log["Styetkilibasvuru-log"]; // Başvuru log kanalı

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    try {
      /* =======================
         1) Slash Komutları
      ======================== */
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
          await command.execute(interaction, client);
        } catch (e) {
          console.error(e);
          const msg = { content: "Komutta bir hata oluştu.", ephemeral: true };
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply(msg);
          } else if (interaction.deferred && !interaction.replied) {
            await interaction.editReply(msg);
          }
        }

        // 🔹 Komut log embed
        try {
          const user = interaction.user;
          const channel = interaction.channel;
          const commandUsed = `/${interaction.commandName}`;
          const ts = Math.floor(interaction.createdTimestamp / 1000);

          const embed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setAuthor({
              name: user.username,
              iconURL: user.displayAvatarURL(),
            })
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(
              `${user} tarafından ${channel} kanalında komut kullanıldı!\n\n` +
                `<:1249678270862069780:1408509202594398218> \`Komutu Kullanan Kişi:\` ${user}\n` +
                `<:1249678268878295087:1409954519001071698> \`Kullanılan Komut:\` **${commandUsed}**\n` +
                `<:1249678341280239697:1408509223171788923> \`Kullanılan Zaman:\` <t:${ts}:F> (<t:${ts}:R>)`
            )
            .setFooter({
              text: `${client.user.username} | Synatx.net`,
              iconURL: client.user.displayAvatarURL(),
            })
            .setTimestamp(interaction.createdAt);

          const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
          if (logChannel?.isTextBased()) {
            await logChannel.send({ embeds: [embed] });
          }
        } catch (err) {
          console.error("Komut log embed gönderilemedi:", err);
        }
        return;
      }

/* =======================
   4) Rol Bilgi Sistemi 
======================= */
if (interaction.isStringSelectMenu() && interaction.customId.startsWith("rolmenu_")) {
  const roleId = interaction.customId.split("_")[1];
  const role = interaction.guild.roles.cache.get(roleId);
  if (!role) {
    return interaction.reply({ content: "⚠️ Rol bulunamadı.", ephemeral: true });
  }

  const members = role.members.map(m => m);
  let desc = "";

  switch (interaction.values[0]) {
    case "kisiler":
      desc = members.length
        ? `> <@&${role.id}> **rolündeki** \`${members.length}\` **kullanıcı aşağıda belirtilmiştir...**\n\n${members.map(m => `${m}`).join("\n")}`
        : "Bu rolde kimse yok.";
      break;

    case "idler":
      if (members.length) {
        // ID’leri txt dosyasına yaz
        const ids = members.map(m => m.id).join("\n");
        const file = new AttachmentBuilder(Buffer.from(ids, "utf-8"), { name: `${role.name}.txt` });

        // Embed sadece kullanıcı adlarını göstersin
        desc = `> <@&${role.id}> **rolündeki** \`${members.length}\` **kullanıcının kullanıcı ID'leri aşağıda belirtilmiştir...**\n\n\`${members.map(m => `${m.user.username}`).join("\n")}\``;

        const embed = new EmbedBuilder()
          .setColor("#add8e6")
          .setAuthor({ name: `${interaction.user.username} - BİLGİ`, iconURL: interaction.user.displayAvatarURL() })
          .setDescription(desc)
          .setThumbnail(interaction.guild.iconURL())
          .setFooter({ text: "Synatx Bot's | Rol Sistemi." });

        // Embed güncelle
        await interaction.update({ embeds: [embed], files: [] });
        // ID'leri txt dosyası olarak sadece kullanıcıya gönder
        await interaction.followUp({ files: [file], ephemeral: true });
        return;
      } else {
        desc = "Bu rolde kimse yok.";
      }
      break;

    case "etiketler":
      desc = members.length
        ? `> <@&${role.id}> **rolündeki** \`${members.length}\` **kullanıcının etiketleri aşağıda belirtilmiştir...**\n\n${members.map(m => `${m.user.tag}`).join("\n")}`
        : "Bu rolde kimse yok.";
      break;

    case "seste":
      const inVoice = members.filter(m => m.voice.channel);
      desc = inVoice.length
        ? `> <@&${role.id}> **rolündeki seste olan kullanıcılar:**\n\n${inVoice.map(m => `**${m.user.username}** - <#${m.voice.channelId}>`).join("\n")}`
        : "Seste olan yok.";
      break;
  }

  const embed = new EmbedBuilder()
    .setColor("#add8e6")
    .setAuthor({ name: `${interaction.user.username} - BİLGİ`, iconURL: interaction.user.displayAvatarURL() })
    .setDescription(desc)
    .setThumbnail(interaction.guild.iconURL())
    .setFooter({ text: "Synatx Bot's | Rol Sistemi." });

  await interaction.update({ embeds: [embed] });
}




      /* =======================
         2) Yetkili Başvuru Sistemi
      ======================== */
      if (interaction.isButton() && interaction.customId === "yetkili_basvuru") {
        const modal = new ModalBuilder()
          .setCustomId("yetkili_form")
          .setTitle("Yetkili Başvuru Formu");

        const aktiflik = new TextInputBuilder()
          .setCustomId("aktiflik")
          .setLabel("Günlük aktiflik süreniz ne kadar?")
          .setStyle(TextInputStyle.Paragraph)
          .setMinLength(10)
          .setMaxLength(1000)
          .setRequired(true);

        const deneyim = new TextInputBuilder()
          .setCustomId("deneyim")
          .setLabel("Yetkililik deneyiminiz?")
          .setStyle(TextInputStyle.Paragraph)
          .setMinLength(10)
          .setMaxLength(1000)
          .setRequired(true);

        const kazanacak = new TextInputBuilder()
          .setCustomId("kazanacak")
          .setLabel("Sunucumuza neler kazandırabilirsiniz?")
          .setStyle(TextInputStyle.Paragraph)
          .setMinLength(10)
          .setMaxLength(1000)
          .setRequired(true);

        const bilgi = new TextInputBuilder()
          .setCustomId("bilgi")
          .setLabel("Kendiniz hakkında bilgi verin")
          .setStyle(TextInputStyle.Paragraph)
          .setMinLength(10)
          .setMaxLength(1000)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(aktiflik),
          new ActionRowBuilder().addComponents(deneyim),
          new ActionRowBuilder().addComponents(kazanacak),
          new ActionRowBuilder().addComponents(bilgi)
        );

        return await interaction.showModal(modal);
      }

      // Modal gönderildiğinde
      if (interaction.isModalSubmit() && interaction.customId === "yetkili_form") {
        await interaction.deferReply({ ephemeral: true });

        const aktiflik = interaction.fields.getTextInputValue("aktiflik");
        const deneyim = interaction.fields.getTextInputValue("deneyim");
        const kazanacak = interaction.fields.getTextInputValue("kazanacak");
        const bilgi = interaction.fields.getTextInputValue("bilgi");

        const logChannel = interaction.guild.channels.cache.get(BASVURU_LOG_CHANNEL_ID);

        const embed = new EmbedBuilder()
          .setDescription(
            `${interaction.user} - (${interaction.user.id}) kullanıcısının sunucuya yaptığı başvuru bilgileri\naşağıda gösteriliyor.\n\n<:1149250145154781287:1413343677258006569> **Aktiflik:** ${aktiflik}\n<a:13899754405501378661:1413636586830037125> **Deneyim:** ${deneyim}\n<a:1389975446560440482:1413636566185807963> **Kazandıracağı şeyler:** ${kazanacak}\n<:1146375638941450250:1413343679006900385> **Kendisi hakkında bilgi:** ${bilgi}`
          )
          .setColor("#1cbc9c");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`onayla_${interaction.user.id}_${aktiflik}_${deneyim}_${kazanacak}_${bilgi}`)
            .setLabel("Kabul Et")
            .setEmoji("<:13899754320777749011:1413932765128425584>")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`reddetBasvuru_${interaction.user.id}_${aktiflik}_${deneyim}_${kazanacak}_${bilgi}`)
            .setLabel("Reddet")
            .setEmoji("<:13899754306013758771:1414619305445691473>")
            .setStyle(ButtonStyle.Danger)
        );

        await logChannel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
        return await interaction.editReply({ content: "Başvuru gönderildi. Okunmasını bekle!" });
      }

      // Onayla / Reddet (Başvuru)
      if (interaction.isButton()) {
        if (interaction.customId.startsWith("onayla_") || interaction.customId.startsWith("reddetBasvuru_")) {
          const [action, userId, aktiflik, deneyim, kazanacak, bilgi] = interaction.customId.split("_");
          const targetUser = await interaction.guild.members.fetch(userId);

          const embed = new EmbedBuilder()
            .setDescription(
              `${interaction.user} - (${interaction.user.id}) kullanıcısının sunucuya yaptığı başvuru bilgileri\naşağıda gösteriliyor.\n\n<:1149250145154781287:1413343677258006569> **Aktiflik:** ${aktiflik}\n<a:13899754405501378661:1413636586830037125> **Deneyim:** ${deneyim}\n<a:1389975446560440482:1413636566185807963> **Kazandıracağı şeyler:** ${kazanacak}\n<:1146375638941450250:1413343679006900385> **Kendisi hakkında bilgi:** ${bilgi}`
            )
            .setColor("#1cbc9c")
            .setFooter({ text: `${interaction.user.tag} tarafından ${action === "onayla" ? "Onaylandı" : "Reddedildi"}` });

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("done_button")
              .setLabel(`${targetUser.user.username} - ${targetUser.id}`)
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true)
          );

          await interaction.update({ content: `<@${userId}>`, embeds: [embed], components: [row] });

          if (action === "onayla") {
            await targetUser.send(`<a:1187141486819688448:1413345682902880448> <@${interaction.user.id}>, \`${interaction.guild.name}\` sunucusundaki yetkili başvurun onaylandı, iyi günler.`);
            await interaction.followUp({ content: `${targetUser} başvurusu onaylandı.`, ephemeral: false });
          } else {
            await targetUser.send(`<a:1187141486819688448:1413345682902880448> <@${interaction.user.id}>, \`${interaction.guild.name}\` sunucusundaki yetkili başvurun reddedildi, iyi günler.`);
            await interaction.followUp({ content: `${targetUser} başvurusu reddedildi.`, ephemeral: false });
          }
        }
      }

      if (interaction.isButton() && interaction.customId.startsWith("mute_kaldir_")) {
  const [ , , userId, cezaId ] = interaction.customId.split("_");
  const member = await interaction.guild.members.fetch(userId).catch(() => null);
  if (!member) return interaction.reply({ content: "⚠️ Kullanıcı bulunamadı.", ephemeral: true });

  const muteRole = interaction.guild.roles.cache.find(r => r.name === "Muted");
  if (muteRole && member.roles.cache.has(muteRole.id)) {
    await member.roles.remove(muteRole, "Mute kaldırıldı");
  }

  await interaction.update({
    content: `✅ <@${userId}> kullanıcısının susturması kaldırıldı.`,
    components: []
  });
}

/* =======================
   3) Ekip Sistemi
======================= */
if (interaction.isButton() || interaction.isStringSelectMenu()) {
  let ekipler = [];
  if (fs.existsSync(EKIPLER_PATH)) {
    ekipler = JSON.parse(fs.readFileSync(EKIPLER_PATH, "utf8"));
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

  // ✅ Onaylama
  if (interaction.customId.startsWith("ekip_onayla_")) {
    const args = interaction.customId.split("_");
    const ekipId = parseInt(args[2]);
    const bossId = args[3];
    const sınır = parseInt(args[4]);
    const renk = args[5];
    const isim = decodeURIComponent(args.slice(6).join("_"));

    const guild = interaction.guild;

    const yetkiliRol = guild.roles.cache.get(config.yetkiliRolId);
    if (!yetkiliRol || !interaction.member.roles.cache.has(yetkiliRol.id)) {
      return interaction.reply({
        content: "⚠️ Bu işlemi sadece yetkililer yapabilir!",
        ephemeral: true
      });
    }

    const kategori = guild.channels.cache.get(config.ekipKategoriId);
    if (!kategori) {
      return interaction.reply({ content: "Kategori yok!", ephemeral: true });
    }

    const boss = await guild.members.fetch(bossId);

    // Kanal oluştur
    const kanal = await guild.channels.create({
      name: `👥・${isim}`,
      type: 0,
      parent: kategori,
      topic: `Ekip ID: ${ekipId}`,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        {
          id: boss.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ManageChannels
          ]
        }
      ]
    });

    // Rol oluştur
    const rol = await guild.roles.create({
      name: isim,
      color: renk || "#5865F2",
      mentionable: true
    });

    // Boss'a rol ver
    try {
      await boss.roles.add(rol);
    } catch (err) {
      console.error(`Boss'a rol verilemedi: ${boss.id}`, err);
    }

    // JSON’a kaydet
    const ekip = {
      id: ekipId,
      isim,
      boss: bossId,
      sınır,
      renk,
      kanal: kanal.id,
      rol: rol.id,
      kayitIsim: `${isim} (ID: ${ekipId} | Kişi: 1)`
    };
    ekipler.push(ekip);
    fs.writeFileSync(EKIPLER_PATH, JSON.stringify(ekipler, null, 2));

    // Embed yanıtı
    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${isim}`)
          .setURL("https://Synatx.net")
          .setDescription(`${isim} isimli ekip başarıyla açıldı!`)
          .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 1024 }))
          .addFields(
            { name: "**Ekip ID**", value: `${ekipId}`, inline: false },
            { name: "**Boss**", value: `<@${boss.id}>`, inline: false },
            { name: "**Rol**", value: `<@&${rol.id}>`, inline: false },
            { name: "**Kanal**", value: `<#${kanal.id}>`, inline: false },
            { name: "**Ekip Sınır**", value: `${sınır}`, inline: false }
          )
          .setFooter({
            text: "Synatx Bot's | Ekip Sistemi.",
            iconURL: interaction.guild.iconURL({ dynamic: true })
          })
      ],
      components: []
    });

    // Kanal içine welcome mesajı
    const welcomeEmbed = new EmbedBuilder()
      .setColor("#3c3c44")
      .setTitle(`${isim}`)
      .setDescription(
        `Aşağıdaki buttonları kullanarak ekip ile ilgili işlem yapabilirsin.`
      )
      .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 1024 }))
      .addFields(
        { name: "**Boss**", value: `<@${boss.id}>`, inline: false },
        {
          name: "**Ekibe Perm istemek için**",
          value: `/ekip perm-iste`,
          inline: false
        }
      )
      .setFooter({
        text: "Synatx Bot's | Ekip Sistemi.",
        iconURL: interaction.guild.iconURL({ dynamic: true })
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`uye_ekle_${ekipId}`)
        .setEmoji("<:1267509137269457037:1414739999013863475>")
        .setLabel("Üye Ekle")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`bossdegis_${ekipId}`)
        .setEmoji("<:1249678598466572379:1409954531332325406>")
        .setLabel("Boss Değiştir")
        .setStyle(ButtonStyle.Danger)
    );

    await kanal.send({ embeds: [welcomeEmbed], components: [row] });
  }

// Üye ekleme
if (interaction.customId.startsWith("uye_ekle_")) {
  const ekipId = parseInt(interaction.customId.split("_")[2]);
  const ekip = ekipler.find(e => e.id === ekipId);
  if (!ekip) return interaction.reply({ content: "⚠️ Ekip bulunamadı.", ephemeral: true });

  const rol = interaction.guild.roles.cache.get(ekip.rol);
  if (!rol) return interaction.reply({ content: "⚠️ Rol bulunamadı.", ephemeral: true });

  const uyeler = interaction.guild.members.cache
    .filter(m => !m.roles.cache.has(rol.id))
    .first(25);

  if (!uyeler.length) {
    return interaction.reply({ content: "Eklenecek üye yok.", ephemeral: true });
  }

  const options = uyeler.map(m => ({
    label: m.displayName.substring(0, 99),
    value: m.id,
    description: m.user.username
  }));

  const menu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`select_member_${ekipId}`)
      .setPlaceholder("Eklenecek üyeleri seçin")
      .addOptions(options)
      .setMinValues(1)
      .setMaxValues(options.length)
  );

  await interaction.reply({
    content: "Aşağıdaki menüden eklenecek kişileri seçin.",
    components: [menu],
    ephemeral: true
  });
}

// Seçim
if (interaction.customId.startsWith("select_member_")) {
  const ekipId = parseInt(interaction.customId.split("_")[2]);
  const ekip = ekipler.find(e => e.id === ekipId);
  if (!ekip) return interaction.reply({ content: "⚠️ Ekip bulunamadı.", ephemeral: true });

  const members = [];
  for (const id of interaction.values) {
    const m = await interaction.guild.members.fetch(id);
    members.push(m);
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`permver_${ekipId}`)
      .setLabel("Perm Ver")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`reddetEkip_${ekipId}`)
      .setLabel("Reddet")
      .setStyle(ButtonStyle.Danger)
  );

  const mentions = members.map(m => `${m}`).join(", ");
  await interaction.channel.send({
    content: `Aşağıdaki kişilere perm verilecek:\n\n${mentions}`,
    components: [row]
  });

  await interaction.deferUpdate();
}

// Perm ver
if (interaction.customId.startsWith("permver_")) {
  const ekipId = parseInt(interaction.customId.split("_")[1]);
  const ekip = ekipler.find(e => e.id === ekipId);
  if (!ekip) return interaction.reply({ content: "⚠️ Ekip bulunamadı.", ephemeral: true });

  const yetkiliRol = interaction.guild.roles.cache.get(config.yetkiliRolId);
  if (!yetkiliRol || !interaction.member.roles.cache.has(yetkiliRol.id)) {
    return interaction.reply({
      content: `${interaction.user} Bu butonları sadece yetkililer kullanabilir.`,
      ephemeral: true
    });
  }

  const msg = await interaction.channel.messages.fetch(interaction.message.id);
  const mentionedMembers = msg.mentions?.members;

  if (!mentionedMembers || mentionedMembers.size === 0) {
    return interaction.reply({ content: "⚠️ Hedef kullanıcılar bulunamadı.", ephemeral: true });
  }

  const rol = interaction.guild.roles.cache.get(ekip.rol);
  if (!rol) return interaction.reply({ content: "⚠️ Ekip rolü bulunamadı.", ephemeral: true });

  const added = [];

  for (const member of mentionedMembers.values()) {
    try {
      if (!member.roles.cache.has(rol.id)) {
        await member.roles.add(rol);
        added.push(`${member}`);
        await interaction.channel.send(`${member} kişisi ekibe eklendi.`);
      } else {
        await interaction.channel.send(`${member} zaten bu ekipte.`);
      }
    } catch (err) {
      console.error(`Rol verilemedi: ${member.id}`, err);
      await interaction.channel.send(`⚠️ Rol verilemedi: <@${member.id}>`);
    }
  }

  // ✅ JSON'da kişi sayısını güncelle
  const uyeSayisi = (await interaction.guild.members.fetch())
    .filter(m => m.roles.cache.has(rol.id)).size;
  ekip.kayitIsim = `${ekip.isim} (ID: ${ekip.id} | Kişi: ${uyeSayisi})`;
  fs.writeFileSync(EKIPLER_PATH, JSON.stringify(ekipler, null, 2));

  if (added.length > 0) {
    await interaction.update({
      content: `${added.join(", ")}\n\nkişilerine rol başarıyla ${interaction.user} tarafından verildi.`,
      components: []
    });
  } else {
    await interaction.update({
      content: `⚠️ Hiç kimseye rol eklenemedi.`,
      components: []
    });
  }
}




  /* =======================
     Yeni eklenen: Ekip Bilgi Butonları
  ======================== */
  if (interaction.customId.startsWith("ekip_")) {
    const args = interaction.customId.split("_");
    const action = args[1];
    const ekipId = parseInt(args[2]);
    const ekip = ekipler.find(e => e.id === ekipId);
    if (!ekip) return interaction.reply({ content: "⚠️ Ekip bulunamadı.", ephemeral: true });

    const rol = interaction.guild.roles.cache.get(ekip.rol);
    if (!rol) return interaction.reply({ content: "⚠️ Ekip rolü bulunamadı.", ephemeral: true });

    const members = (await interaction.guild.members.fetch()).filter(m => m.roles.cache.has(rol.id));

    if (action === "yasakla") {
      for (const member of members.values()) {
        await member.ban({ reason: `Ekip ${ekip.isim} yasaklandı` }).catch(() => {});
      }
      return interaction.reply({ content: `Ekip **${ekip.isim}** yasaklandı.`, ephemeral: false });
    }

    if (action === "yasakac") {
      for (const ban of await interaction.guild.bans.fetch()) {
        if (members.has(ban.user.id)) {
          await interaction.guild.members.unban(ban.user.id).catch(() => {});
        }
      }
      return interaction.reply({ content: `Ekip **${ekip.isim}** yasağı kaldırıldı.`, ephemeral: false });
    }

    if (action === "whitelist") {
      const wlRol = interaction.guild.roles.cache.get(config.whitelistRolId);
      if (!wlRol) return interaction.reply({ content: "⚠️ Whitelist rolü yok.", ephemeral: true });

      for (const member of members.values()) {
        await member.roles.add(wlRol).catch(() => {});
        await interaction.channel.send(`${member} whitelist'e eklendi.`);
      }
      return interaction.deferUpdate();
    }

    if (action === "whitelistal") {
      const wlRol = interaction.guild.roles.cache.get(config.whitelistRolId);
      if (!wlRol) return interaction.reply({ content: "⚠️ Whitelist rolü yok.", ephemeral: true });

      for (const member of members.values()) {
        await member.roles.remove(wlRol).catch(() => {});
        await interaction.channel.send(`${member} whitelist'ten çıkarıldı.`);
      }
      return interaction.deferUpdate();
    }

    if (action === "blacklist") {
      let blacklist = [];
      if (fs.existsSync(BLACKLIST_PATH)) {
        blacklist = JSON.parse(fs.readFileSync(BLACKLIST_PATH, "utf8"));
      }

      for (const member of members.values()) {
        if (!blacklist.includes(member.id)) {
          blacklist.push(member.id);
        }
        await member.ban({ reason: `Ekip ${ekip.isim} blacklistlendi` }).catch(() => {});
      }

      fs.writeFileSync(BLACKLIST_PATH, JSON.stringify(blacklist, null, 2));
      return interaction.reply({ content: `Ekip **${ekip.isim}** blacklist'e eklendi.`, ephemeral: false });
    }

    if (action === "blacklistac") {
      let blacklist = [];
      if (fs.existsSync(BLACKLIST_PATH)) {
        blacklist = JSON.parse(fs.readFileSync(BLACKLIST_PATH, "utf8"));
      }

      blacklist = blacklist.filter(id => !members.has(id));
      fs.writeFileSync(BLACKLIST_PATH, JSON.stringify(blacklist, null, 2));

      for (const ban of await interaction.guild.bans.fetch()) {
        if (members.has(ban.user.id)) {
          await interaction.guild.members.unban(ban.user.id).catch(() => {});
        }
      }
      return interaction.reply({ content: `Ekip **${ekip.isim}** blacklist'ten çıkarıldı.`, ephemeral: false });
    }
  }
}

    /* =======================
       5) Çekiliş Sistemi
    ======================== */
    if (interaction.isStringSelectMenu() && interaction.customId === "çekiliş_menu") {
      const value = interaction.values[0];

      if (value === "başlat") {
        // 3. Görsel - Çekiliş Başlat modal'ı
        const modal = new ModalBuilder()
          .setCustomId("çekiliş_başlat")
          .setTitle("Çekiliş Başlat");

        const kanalId = new TextInputBuilder()
          .setCustomId("kanal_id")
          .setLabel("Çekiliş Kanal ID *")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Örn: 123456789")
          .setRequired(true);

        const ödül = new TextInputBuilder()
          .setCustomId("ödül")
          .setLabel("Çekiliş Ödülü *")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Örn: Spotify Premium")
          .setRequired(true);

        const süre = new TextInputBuilder()
          .setCustomId("süre")
          .setLabel("Çekiliş Süresi *")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Örn: 10m = 10 Dakika")
          .setRequired(true);

        const kazananSayısı = new TextInputBuilder()
          .setCustomId("kazanan_sayısı")
          .setLabel("Kazanacak Sayısı *")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Örn: 2")
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(kanalId),
          new ActionRowBuilder().addComponents(ödül),
          new ActionRowBuilder().addComponents(süre),
          new ActionRowBuilder().addComponents(kazananSayısı)
        );

        await interaction.showModal(modal);
        
        // Modal açıldıktan sonra mesajı sil
        setTimeout(async () => {
          try {
            await interaction.deleteReply();
          } catch (err) {
            // Mesaj zaten silinmiş olabilir
          }
        }, 100);
      }

      if (value === "bitir") {
        // Son görsel - Çekiliş Bitir modal'ı
        const modal = new ModalBuilder()
          .setCustomId("çekiliş_bitir")
          .setTitle("Çekiliş Bitir");

        const mesajId = new TextInputBuilder()
          .setCustomId("mesaj_id")
          .setLabel("Çekiliş Mesaj ID *")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Örn: 123456789")
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(mesajId)
        );

        await interaction.showModal(modal);
        
        // Modal açıldıktan sonra mesajı sil
        setTimeout(async () => {
          try {
            await interaction.deleteReply();
          } catch (err) {
            // Mesaj zaten silinmiş olabilir
          }
        }, 100);
      }

      if (value === "yeniden") {
        // 6. Görsel - Çekilişi Yeniden Çek modal'ı
        const modal = new ModalBuilder()
          .setCustomId("çekiliş_yeniden")
          .setTitle("Çekilişi Yeniden Çek");

        const mesajId = new TextInputBuilder()
          .setCustomId("mesaj_id")
          .setLabel("Çekiliş Mesaj ID *")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Örn: 123456789")
          .setRequired(true);

        const yenidenSayısı = new TextInputBuilder()
          .setCustomId("yeniden_sayısı")
          .setLabel("Yeniden Çekilecek Kazanan Sayısı")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Örn: 1 (Boş bırakılırsa tüm kazananlar yeniden çekilir)")
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(mesajId),
          new ActionRowBuilder().addComponents(yenidenSayısı)
        );

        await interaction.showModal(modal);
        
        // Modal açıldıktan sonra mesajı sil
        setTimeout(async () => {
          try {
            await interaction.deleteReply();
          } catch (err) {
            // Mesaj zaten silinmiş olabilir
          }
        }, 100);
      }
    }

    // Modal submit işlemleri
    if (interaction.isModalSubmit()) {
      if (interaction.customId === "çekiliş_başlat") {
        const kanalId = interaction.fields.getTextInputValue("kanal_id");
        const ödül = interaction.fields.getTextInputValue("ödül");
        const süre = interaction.fields.getTextInputValue("süre");
        const kazananSayısı = parseInt(interaction.fields.getTextInputValue("kazanan_sayısı"));

        // Süreyi parse et (örn: 10m, 1h, 30s)
        let süreMs = 0;
        const süreMatch = süre.match(/(\d+)([smhd])/);
        if (süreMatch) {
          const sayı = parseInt(süreMatch[1]);
          const birim = süreMatch[2];
          switch (birim) {
            case 's': süreMs = sayı * 1000; break;
            case 'm': süreMs = sayı * 60 * 1000; break;
            case 'h': süreMs = sayı * 60 * 60 * 1000; break;
            case 'd': süreMs = sayı * 24 * 60 * 60 * 1000; break;
          }
        }

        // Kanalı bul
        const kanal = interaction.guild.channels.cache.get(kanalId);
        if (!kanal) {
          return interaction.reply({ content: "Kanal bulunamadı!", ephemeral: true });
        }

        // 4. Görsel - Çekiliş embed'i
        const çekilişEmbed = new EmbedBuilder()
          .setTitle("🎁 Ödül: " + ödül)
          .setDescription(
            `Katılmak için 🎉 tepkisine tıklayın!\n\n\n` +
            `🕓 **Kalan Süre:** <t:${Math.floor((Date.now() + süreMs) / 1000)}:R>\n` +
            `👤 **Başlatan:** ${interaction.user}`
          )
          .setColor("#add8e6")
          .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
          .setFooter({
            text: `🎯 Kazanan Sayısı: ${kazananSayısı} • ${new Date(Date.now() + süreMs).toLocaleString("tr-TR")}`
          });

        const çekilişMesajı = await kanal.send({ 
          content: "> 🎉 Çekiliş Başladı! 🎉",
          embeds: [çekilişEmbed] 
        });
        await çekilişMesajı.react("🎉");

        // Sistem mesajı
        await interaction.reply({ 
          content: `🎉 ${ödül} ödüllü ${kazananSayısı} kişinin kazanacağı ${süre} süreli çekiliş ${kanal} kanalında başlatıldı!`,
          ephemeral: false 
        });

        // Her saniye güncelleme timer'ı
        const başlangıçZamanı = Date.now();
        const güncellemeInterval = setInterval(async () => {
          try {
            const geçenSüre = Date.now() - başlangıçZamanı;
            const kalanSüre = Math.max(0, süreMs - geçenSüre);
            const kalanSaniye = Math.ceil(kalanSüre / 1000);
            
            if (kalanSaniye <= 0) {
              clearInterval(güncellemeInterval);
              return;
            }

            let güncelEmbed;
            if (kalanSaniye <= 15) {
              // Son 15 saniye - uyarı embed'i
              güncelEmbed = new EmbedBuilder()
                .setTitle("🎁 Ödül: " + ödül)
                .setDescription(
                  `⚠️ **ÇEKİLİŞ BİTMEK ÜZERE!** ⚠️\n\n\n` +
                  `Katılmak için 🎉 tepkisine tıklayın!\n\n\n` +
                  `🕒 **Kalan Süre:** <t:${Math.floor((Date.now() + kalanSüre) / 1000)}:R>\n` +
                  `👤 **Başlatan:** ${interaction.user}`
                )
                .setColor("#660000")
                .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                .setFooter({
                  text: `✅ Kazanan Sayısı: ${kazananSayısı} • ${new Date(Date.now() + kalanSüre).toLocaleString("tr-TR")}`,
                  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
                });
            } else {
              // Normal embed
              güncelEmbed = new EmbedBuilder()
                .setTitle("🎁 Ödül: " + ödül)
                .setDescription(
                  `Katılmak için 🎉 tepkisine tıklayın!\n\n\n` +
                  `🕓 **Kalan Süre:** <t:${Math.floor((Date.now() + kalanSüre) / 1000)}:R>\n` +
                  `👤 **Başlatan:** ${interaction.user}`
                )
                .setColor("#add8e6")
                .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                .setFooter({
                  text: `🎯 Kazanan Sayısı: ${kazananSayısı} • ${new Date(Date.now() + kalanSüre).toLocaleString("tr-TR")}`,
                  iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
                });
            }

            await çekilişMesajı.edit({ embeds: [güncelEmbed] });
          } catch (err) {
            console.error("Çekiliş güncelleme hatası:", err);
            clearInterval(güncellemeInterval);
          }
        }, 1000); // Her saniye güncelle

        // Çekiliş bitişi
        setTimeout(async () => {
          try {
            clearInterval(güncellemeInterval); // Interval'ı temizle
            const güncelMesaj = await kanal.messages.fetch(çekilişMesajı.id);
            const tepkiler = güncelMesaj.reactions.cache.get("🎉");
            
            if (!tepkiler) {
              await çekilişMesajı.edit({ 
                content: "| 🎉 Çekiliş Sona Erdi! 🎉\n\nGeçerli katılım yok, yeni kazanan(lar) seçilemez!",
                embeds: [],
                components: []
              });
              return;
            }

            const katılımcılar = await tepkiler.users.fetch();
            const geçerliKatılımcılar = katılımcılar.filter(user => !user.bot && user.id !== interaction.client.user.id);
            
            if (geçerliKatılımcılar.size === 0) {
              await çekilişMesajı.edit({ 
                content: "| 🎉 Çekiliş Sona Erdi! 🎉\n\nGeçerli katılım yok, yeni kazanan(lar) seçilemez!",
                embeds: [],
                components: []
              });
              return;
            }

            // Kazananları seç
            const kazananlar = [];
            const katılımcıArray = Array.from(geçerliKatılımcılar.values());
            const seçileceStayı = Math.min(kazananSayısı, katılımcıArray.length);
            
            for (let i = 0; i < seçileceStayı; i++) {
              const rastgeleIndex = Math.floor(Math.random() * katılımcıArray.length);
              kazananlar.push(katılımcıArray[rastgeleIndex]);
              katılımcıArray.splice(rastgeleIndex, 1);
            }

            // 6. Görsel - Çekiliş sonuçları
            const sonuçEmbed = new EmbedBuilder()
              .setTitle("🎉 Çekiliş Sona Erdi! 🎉")
              .setDescription(
                `🎁 **Ödül:** ${ödül}\n\n` +
                `🏆 **Kazanan(lar):** ${kazananlar.map(k => `<@${k.id}>`).join(", ")}\n\n` +
                `👤 **Başlatan:** ${interaction.user}\n` +
                `🗓️ **Bitiş Zamanı:** • ${new Date().toLocaleString("tr-TR")}`
              )
              .setColor("#ff0000")
              .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
              .setFooter({
                text: "Synatx Bot's | Çekiliş Sistemi",
                iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
              });

            await çekilişMesajı.edit({ 
              content: "| 🎉 Çekiliş Sona Erdi! 🎉",
              embeds: [sonuçEmbed],
              components: []
            });

            // Tebrik mesajı
            await kanal.send(`| 🎉 Tebrikler ${kazananlar.map(k => `<@${k.id}>`).join(", ")}, ${ödül} ödülünü kazandınız! 🎉\n\n📎 Çekilişe Git: ${çekilişMesajı.url}`);

          } catch (err) {
            console.error("Çekiliş bitiş hatası:", err);
          }
        }, süreMs);
      }

      if (interaction.customId === "çekiliş_bitir") {
        const mesajId = interaction.fields.getTextInputValue("mesaj_id");
        
        try {
          const mesaj = await interaction.channel.messages.fetch(mesajId);
          await mesaj.edit({ 
            content: "| 🎉 Çekiliş Sona Erdi! 🎉",
            embeds: [],
            components: []
          });
          
          await interaction.reply({ content: "Çekiliş başarıyla bitirildi!", ephemeral: true });
        } catch (err) {
          await interaction.reply({ content: "Mesaj bulunamadı veya çekiliş zaten bitmiş!", ephemeral: true });
        }
      }

      if (interaction.customId === "çekiliş_yeniden") {
        const mesajId = interaction.fields.getTextInputValue("mesaj_id");
        const yenidenSayısı = interaction.fields.getTextInputValue("yeniden_sayısı");
        
        try {
          const mesaj = await interaction.channel.messages.fetch(mesajId);
          const tepkiler = mesaj.reactions.cache.get("🎉");
          
          if (!tepkiler) {
            return interaction.reply({ content: "Geçerli katılım yok, yeni kazanan(lar) seçilemez!", ephemeral: true });
          }

          const katılımcılar = await tepkiler.users.fetch();
          const geçerliKatılımcılar = katılımcılar.filter(user => !user.bot && user.id !== interaction.client.user.id);
          
          if (geçerliKatılımcılar.size === 0) {
            return interaction.reply({ content: "Geçerli katılım yok, yeni kazanan(lar) seçilemez!", ephemeral: true });
          }

          // Yeniden çek
          const kazananlar = [];
          const katılımcıArray = Array.from(geçerliKatılımcılar.values());
          const seçileceStayı = yenidenSayısı ? Math.min(parseInt(yenidenSayısı), katılımcıArray.length) : katılımcıArray.length;
          
          for (let i = 0; i < seçileceStayı; i++) {
            const rastgeleIndex = Math.floor(Math.random() * katılımcıArray.length);
            kazananlar.push(katılımcıArray[rastgeleIndex]);
            katılımcıArray.splice(rastgeleIndex, 1);
          }

          await interaction.reply({ 
            content: `| 🔄 ${kazananlar.map(k => `<@${k.id}>`).join(", ")} ödüllü çekiliş yeniden çekildi!`,
            ephemeral: false 
          });

        } catch (err) {
          await interaction.reply({ content: "Mesaj bulunamadı!", ephemeral: true });
        }
      }
    }

    } catch (err) {
      console.error("interactionCreate HATASI:", err);
    }
  },
};
