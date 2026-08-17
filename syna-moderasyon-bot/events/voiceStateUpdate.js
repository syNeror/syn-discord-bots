    // events/voiceStateUpdate.js
    const { EmbedBuilder, Colors, AuditLogEvent, time } = require('discord.js');
    const fs = require('node:fs');

    const cfg = JSON.parse(fs.readFileSync('./log.json', 'utf8'));
    const LOG_CH = cfg['Stvoice-log'];

    /* Yardımcılar */
    const unixNow = () => Math.floor(Date.now() / 1000);

    function fieldTime(unix) {
    // "Zaman / Tarih" alanı: <t:xxxxxx:f> ( <t:xxxxxx:R> )
    return {
        name: 'Zaman / Tarih',
        value: `<t:${unix}:f>  (${time(unix, 'R')})`,
        inline: false,
    };
    }

    function sendLog(channel, embed) {
    if (!channel) return;
    channel.send({ embeds: [embed] }).catch(() => {});
    }

    async function fetchExecutor(guild, targetId) {
    try {
        const logs = await guild.fetchAuditLogs({
        type: AuditLogEvent.MemberUpdate,
        limit: 5,
        });
        const now = Date.now();
        const entry = logs.entries.find(
        (e) =>
            e.target?.id === targetId &&
            now - e.createdTimestamp < 15_000 // 15 sn içinde yapılan işlem say
        );
        return entry?.executor || null;
    } catch {
        return null;
    }
    }

    module.exports = {
    name: 'voiceStateUpdate',

    /**
     * @param {import('discord.js').VoiceState} oldState
     * @param {import('discord.js').VoiceState} newState
     */
    async execute(oldState, newState) {
        const guild = newState.guild || oldState.guild;
        const logChannel = guild.channels.cache.get(LOG_CH);
        const member = newState.member || oldState.member;
        const user = member?.user;
        const unix = unixNow();

        // 1) KANALA GİRİŞ
        if (!oldState.channelId && newState.channelId) {
        const ch = newState.channel;
        const e = new EmbedBuilder()
            .setColor("#04fc04")
            .setDescription(`<a:1187141486819688448:1413345682902880448> ${member},<#${ch.id}> **Adlı Kanala Katıldı!**`)
            .addFields(fieldTime(unix))
            .setFooter({ text: "Synatx Bot's | Log Sistemi." })
            .setThumbnail(user.displayAvatarURL({ size: 256 }));
        return sendLog(logChannel, e);
        }

        // 2) KANALDAN AYRILMA
        if (oldState.channelId && !newState.channelId) {
        const ch = oldState.channel;
        const e = new EmbedBuilder()
            .setColor("#b41414")
            .setDescription(`<a:1187141486819688448:1413345682902880448> ${member} , <#${ch.id}> **Adlı Kanaldan Ayrıldı!**`)
            .addFields(fieldTime(unix))
            .setFooter({ text: "Synatx Bot's | Log Sistemi." })
            .setThumbnail(user.displayAvatarURL({ size: 256 }));
        return sendLog(logChannel, e);
        }

        // 3) SUNUCU (SERVER) MUTE AÇILDI
        if (!oldState.serverMute && newState.serverMute) {
        const exec = await fetchExecutor(guild, member.id);
        const ch = newState.channel ?? oldState.channel;
        const e = new EmbedBuilder()
            .setColor("#b41414")
            .setDescription(
            `<a:1389982023455740078:1414430427145310348> ${exec ? `${exec}` : 'Bir yetkili'},<#${ch?.id}> **Adlı Kanalda** ${member}\n` +
                `**Tarafından Susturuldu!** Sebep: Belirtilmemiş`
            )
            .addFields(fieldTime(unix))
            .setFooter({ text: "Synatx Bot's | Log Sistemi." })
            .setThumbnail(user.displayAvatarURL({ size: 256 }));
        return sendLog(logChannel, e);
        }

        // 4) SUNUCU (SERVER) MUTE KALDIRILDI
        if (oldState.serverMute && !newState.serverMute) {
        const exec = await fetchExecutor(guild, member.id);
        const ch = newState.channel ?? oldState.channel;
        const e = new EmbedBuilder()
            .setColor("#04fc04")
            .setDescription(
            `<a:1389982023455740078:1414430427145310348> ${exec ? `${exec}` : 'Bir yetkili'},<#${ch?.id}> **Adlı Kanalda** ${member}\n` +
                `**Tarafından Susturması Kaldırıldı!** Sebep: Belirtilmemiş`
            )
            .addFields(fieldTime(unix))
            .setFooter({ text: "Synatx Bot's | Log Sistemi." })
            .setThumbnail(user.displayAvatarURL({ size: 256 }));
        return sendLog(logChannel, e);
        }

        // 4.1) SUNUCU (SERVER) SAĞIRLAŞTIRILDI
        if (!oldState.serverDeaf && newState.serverDeaf) {
        const exec = await fetchExecutor(guild, member.id);
        const ch = newState.channel ?? oldState.channel;
        const e = new EmbedBuilder()
            .setColor("#54542c")
            .setDescription(
            `<a:1389983204492054630:1414430422120661112> ${exec ? `${exec}` : 'Bir yetkili'},<#${ch?.id}> **Adlı Kanalda** ${member}\n` +
            `**Tarafından Sağırlaştırıldı!** Sebep: Belirtilmemiş`
            )
            .addFields(fieldTime(unix))
            .setFooter({ text: "Synatx Bot's | Log Sistemi." })
            .setThumbnail(user.displayAvatarURL({ size: 256 }));
        return sendLog(logChannel, e);
        }

        // 4.2) SUNUCU (SERVER) SAĞIRLAŞTIRMA KALDIRILDI
        if (oldState.serverDeaf && !newState.serverDeaf) {
        const exec = await fetchExecutor(guild, member.id);
        const ch = newState.channel ?? oldState.channel;
        const e = new EmbedBuilder()
            .setColor("#ecec0c")
            .setDescription(
            `<a:1389983208371781754:1414430430861459477> ${exec ? `${exec}` : 'Bir yetkili'},<#${ch?.id}> **Adlı Kanalda** ${member}\n` +
            `**Tarafından Sağırlaştırması Kaldırıldı!** Sebep: Belirtilmemiş`
            )
            .addFields(fieldTime(unix))
            .setFooter({ text: "Synatx Bot's | Log Sistemi." })
            .setThumbnail(user.displayAvatarURL({ size: 256 }));
        return sendLog(logChannel, e);
        }

// 5) KENDİNİ MUTE
if (!oldState.selfMute && newState.selfMute && !newState.selfDeaf) {
    const ch = newState.channel ?? oldState.channel;
    const e = new EmbedBuilder()
        .setColor("#2c443c")
        .setDescription(`<a:1389982023455740078:1414430427145310348> ${member} <#${ch?.id}> **Adlı Kanalda Kendini Susturdu!**`)
        .addFields(fieldTime(unix))
        .setFooter({ text: "Synatx Bot's | Log Sistemi." })
        .setThumbnail(user.displayAvatarURL({ size: 256 }));
    return sendLog(logChannel, e);
}

// 6) KENDİNİ SAĞIRLAŞTIRDI
if (!oldState.selfDeaf && newState.selfDeaf) {
    const ch = newState.channel ?? oldState.channel;
    const e = new EmbedBuilder()
        .setColor("#54542c")
        .setDescription(`<a:1389983204492054630:1414430422120661112> ${member} <#${ch?.id}> **Adlı Kanalda Kendini Sağırlaştırdı!**`)
        .addFields(fieldTime(unix))
        .setFooter({ text: "Synatx Bot's | Log Sistemi." })
        .setThumbnail(user.displayAvatarURL({ size: 256 }));
    return sendLog(logChannel, e);
}

        // 7) KENDİ SAĞIRLAŞTIRMASINI KALDIRDI
        if (oldState.selfDeaf && !newState.selfDeaf) {
        const ch = newState.channel ?? oldState.channel;
        const e = new EmbedBuilder()
            .setColor("#ecec0c")
            .setDescription(`<a:1389983208371781754:1414430430861459477> ${member} <#${ch?.id}> **Adlı Kanalda Kendi Sağırlaştırmasını Kaldırdı!**`)
            .addFields(fieldTime(unix))
            .setFooter({ text: "Synatx Bot's | Log Sistemi." })
            .setThumbnail(user.displayAvatarURL({ size: 256 }));
        return sendLog(logChannel, e);
        }

        // 8) KENDİ MUTE'UNU KALDIRDI
        if (oldState.selfMute && !newState.selfMute) {
        const ch = newState.channel ?? oldState.channel;
        const e = new EmbedBuilder()
            .setColor("#04f0d8")
            .setDescription(`<a:1389982023455740078:1414430427145310348> ${member} <#${ch?.id}> Adlı Kanalda Kendi Susturmasını Kaldırdı!`)
            .addFields(fieldTime(unix))
            .setFooter({ text: "Synatx Bot's | Log Sistemi." })
            .setThumbnail(user.displayAvatarURL({ size: 256 }));
        return sendLog(logChannel, e);
        }
    },
    };
