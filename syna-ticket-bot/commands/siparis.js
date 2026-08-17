const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

const siparisDataPath = path.join(__dirname, '../siparisdata.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('siparis')
    .setDescription('Yeni sipariş oluştur')
    .addUserOption(option =>
      option.setName('musteri')
        .setDescription('Müşteri seç')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('islem_turu')
        .setDescription('İşlem türü seç')
        .setRequired(true)
        .addChoices(
          { name: 'sᴀᴛıɴ ᴀʟıᴍ', value: 'sᴀᴛıɴ ᴀʟıᴍ' }
        )
    )
    .addStringOption(option =>
      option.setName('paket')
        .setDescription('Paket türü seç')
        .setRequired(true)
        .addChoices(
          { name: 'Full Pack', value: 'Full Pack' },
          { name: 'Medium Pack', value: 'Medium Pack' },
          { name: 'Lite Pack', value: 'Lite Pack' }
        )
    )
    .addIntegerOption(option =>
      option.setName('tutar')
        .setDescription('Tutar girin')
        .setRequired(true)
    ),

  async execute(interaction) {
    const musteri = interaction.options.getUser('musteri');
    const islemTuru = interaction.options.getString('islem_turu');
    const paket = interaction.options.getString('paket');
    const tutar = interaction.options.getInteger('tutar');

    // Sipariş verilerini yükle
    let siparisData;
    try {
      siparisData = JSON.parse(fs.readFileSync(siparisDataPath, 'utf8'));
    } catch (error) {
      siparisData = { lastId: 0, siparisler: [] };
    }

    // Yeni sipariş ID'si
    siparisData.lastId += 1;
    const siparisNo = siparisData.lastId;

    // Paket adlarını düzenle
    const paketAdi = {
      'full_pack': 'Full Pack',
      'medium_pack': 'Medium Pack',
      'lite_pack': 'Lite Pack'
    }[paket] || paket;

    // İşlem türü adını düzenle
    const islemTuruAdi = {
      'satin_alim': 'sᴀᴛıɴ ᴀʟıᴍ'
    }[islemTuru] || islemTuru;

    // Sipariş verisini kaydet
    const yeniSiparis = {
      id: siparisNo,
      musteri: {
        id: musteri.id,
        username: musteri.username
      },
      islemTuru: islemTuruAdi,
      paket: paketAdi,
      tutar: tutar,
      tarih: new Date().toISOString()
    };

    siparisData.siparisler.push(yeniSiparis);
    fs.writeFileSync(siparisDataPath, JSON.stringify(siparisData, null, 2));

    // Embed oluştur
    const embed = new EmbedBuilder()
      .setTitle(`Lyn Design | Satın Alım Sistemi`)
      .setURL('https://discord.gg/kakashi')
      .setDescription(`\`\`\`📋 Sipariş Detayları\`\`\` \n<a:1187256299298246737:1391586851323908186> **Sipariş No:** \`${siparisNo}\` \n<:11898891283771064921:1391586814573281331> İşlem Türü: \`${islemTuru}\`\n\n\`\`\`👤 Müşteri Bilgileri\`\`\`\n<a:1187255239989006427:1391586861688033301> Müşteri: \`${musteri.username}\`\n<:1146373020231938128:1391586819837005965> ID: \`${musteri.id}\`\n\n\`\`\`🛍️ Ürün Detayları\`\`\`\n<a:1187135503515013160:1391586817270091828> Paket: \`${paket}\`\n<:1166817151294902293:1391586816372772914> Tutar: \`${tutar} TL\``)
      .setImage('https://media.discordapp.net/attachments/1372845267627409519/1373260449016971275/gif.gif?ex=686c57b4&is=686b0634&hm=cdb45f9c4c1a0284285dd40c03df93d32396e62626afb600dd2759b460c84cc3&=&width=1440&height=360')
      .setThumbnail("https://media.discordapp.net/attachments/1372845267627409519/1380925449764474950/lynyeni-gif.gif?ex=686be20b&is=686a908b&hm=961066c93b9da77e092e8bf989c8f2ec35d42e6e687d9909e4b8dbfcd3fae014&=&width=375&height=375")
      .setColor('#a6cfdc')
      .setThumbnail(musteri.displayAvatarURL())
      .setFooter({ text: 'Synatx Bot\'s | Sipariş Sistemi' })
      .setTimestamp();

    // Kullanıcıya başarı mesajı gönder
    await interaction.reply({ 
      content: `✅ **Sipariş başarıyla oluşturuldu!** \n📋 Sipariş No: \`${siparisNo}\``, 
      ephemeral: true 
    });

    // Sipariş kanalına embed'i gönder
    const siparisKanali = interaction.guild.channels.cache.get(config.siparisid);
    if (siparisKanali) {
      await siparisKanali.send({ embeds: [embed] });
    }
  },
};