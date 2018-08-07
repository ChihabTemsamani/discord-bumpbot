const Discord = require('discord.js');
const fs = require('fs');
const moment = require('moment');
let config;
const Database = require('./structures/Database.js');

new Database();

let guild, channel, valid;

fs.readFile('./config.json', async (err, data) => {
    if (err) {
        let example = { "bot_token" : "", "guild" : "", "bumpchannel" : "", "bumprole" : "", "bumpbots" : [{ "botid" : "", "interval" : { "hours" : "", "minutes" : "", "seconds" : "" }, "bumpcommand" : "", "website" : null }]};
        await fs.writeFileSync('./config.json', JSON.stringify(example));
        console.log("Der Bot wurde zum ersten mal gestartet. Bitte fülle die generierte config.json aus und starte den Bot anschließend neu.");
        return process.exit(0);
    };
    config = require('./config.json');
    if (!config.bumpbots || !config.bumpbots[0] || config.bumpbots.filter(bot => !bot.botid && !bot.website || !bot.interval || !bot.bumpcommand).length == config.bumpbots.length) {
        console.log("Der Bot wird nicht gestartet, weil kein einziger Bumpbot angegeben wurde.");
        return process.exit(1);
    };
    if (!config.bot_token) {
        console.log("Du musst den Bot Token des Discord Bots in der config.json angeben.");
        return process.exit(1);
    };
    
    const client = new Discord.Client({ autoReconnect: true, disableEveryone: true });
    
    if (config.bot_token) client.login(config.bot_token);
    
    client.on('ready', async () => {
        console.log("Der Bumpbot wurde als " + client.user.tag + " eingeloggt.");
        guild = client.guilds.get(config.guild);
        if (!guild) {
            console.log("Fehler: Der Server, der in der config.json angegeben wurde, wurde nicht gefunden. Bitte füge den Bot auf den Server hinzu.");
            let invite = await client.generateInvite(["VIEW_CHANNEL", "SEND_MESSAGES"]);
            console.log(invite);
            return process.exit(1);
        };
        channel = guild.channels.get(config.bumpchannel) || guild.channels.find("name", config.bumpchannel);
        if (!channel) {
            console.log("Fehler: Der Kanal, der in der config.json angegeben wurde, existiert nicht oder ich habe nicht die Berechtigungen, in diesen Nachrichten zu versenden.");
            return process.exit(1);
        };
        client.guilds.filter(g => g.id != config.guild).forEach(async g => {
            g.leave();
        });
        valid = config.bumpbots.filter(bot => bot.interval && bot.bumpcommand).filter(bot => bot.interval.hours || bot.interval.minutes || bot.interval.seconds).filter(bot => bot.website || client.guilds.get(config.guild).members.get(bot.botid) !== undefined).filter(bot => bot.website || client.guilds.get(config.guild).members.get(bot.botid).user.bot);
        if (valid.length == 0) {
            console.log("Kein einziger Bumpbot würde funktionieren, bitte überprüfe die Richtigkeit der Informationen in der config.json. Denke daran, dass die Bumpbots alle auf deinem Discord-Server sein müssen.");
            return process.exit(1);
        };
        console.log(`${valid.length} von ${config.bumpbots.length} Bots funktionieren.`);
        for (var bot of valid) {
            if (bot.website) bot.botid = bot.website;
            const DBEntry = await Database.Bumps.findOne({ where: { botid: bot.botid }});
            if (!DBEntry) {
                let momentdate = moment().add(bot.interval.hours || 0, 'hours').add(bot.interval.minutes || 0, 'minutes').add(bot.interval.seconds || 0, 'seconds');
                let date = new Date(momentdate).getTime();
                await Database.Bumps.create({ botid: bot.botid, nextbump: date, notification: false });
            };
        };
        setInterval(async () => {
            const DBEntry = await Database.Bumps.findOne({ where: { nextbump: { [require('sequelize').Op.lte] : Date.now() }, notification: false }});
            if (DBEntry) {
                let bot = valid.filter(v => v.botid == DBEntry.botid)[0];
                if (!bot) {
                    await Database.Bumps.destroy({ where: { botid: DBEntry.botid }});
                    return;
                };
                await Database.Bumps.update({ notification: true }, { where: { botid: DBEntry.botid }});
                if (bot.website) return channel.send(`<@&${config.bumprole}>, es kann nun für die Webseite ${bot.website} gebumpt werden. Jemand muss auf die Seite gehen, bumpen und anschließend \`${bot.bumpcommand}\` ausführen.`);
                channel.send(`<@&${config.bumprole}>, <@${bot.botid}> kann nun gebumpt werden. Jemand muss \`${bot.bumpcommand}\` ausführen.`);
            };
        }, 1000);
    });
    client.on('message', async message => {
        if (message.author.bot) return;
        if (!message.guild) return;
        if (message.guild.id != guild.id) return;
        if (message.channel.id != channel.id) return;
        if (message.content.toLowerCase().startsWith('!addbot')) {
            if (!message.member.roles.has(config.bumprole)) return message.channel.send("Du besitzt nicht die Bumprolle.");
            let args = message.content.split(' ').slice(1);
            if (!args[0]) return message.channel.send(`${message.author}, um neue Bots hinzuzufügen, besuche doch <https://terax235.github.io/discord-bumpbot/assistant>.`);
            try {
                let parsed = JSON.parse(args.join(' '));
                if (parsed.website) {
                    if (!parsed.interval || !parsed.interval.hours && !parsed.interval.minutes || !parsed.bumpcommand) return message.channel.send("Das Objekt enthält falsche Werte.");
                    const Data = valid.filter(en => en.botid == parsed.website)[0];
                    if (Data) return message.channel.send("Die Seite existiert bereits.");
                    parsed.botid = parsed.website;
                    valid.push(parsed);
                    let config = JSON.parse(fs.readFileSync('./config.json'));
                    config.bumpbots.push(parsed);
                    fs.writeFileSync('./config.json', JSON.stringify(config));
                    let momentdate = moment().add(parsed.interval.hours || 0, 'hours').add(parsed.interval.minutes || 0, 'minutes').add(parsed.interval.seconds || 0, 'seconds');
                    let date = new Date(momentdate).getTime();
                    await Database.Bumps.create({ botid: parsed.website, nextbump: date, notification: false });
                    console.log(`Webseite ${parsed.website} wurde hinzugefügt.`);
                    return message.channel.send("Die Seite wurde erfolgreich hinzugefügt.");
                } else {
                    if (!parsed.botid) return message.channel.send("Das Objekt enthält falsche Werte.");
                    if (!guild.members.get(parsed.botid)) return message.channel.send("Der Bot wurde auf diesem Server nicht gefunden.");
                    if (!parsed.interval || !parsed.interval.hours && !parsed.interval.minutes || !parsed.bumpcommand) return message.channel.send("Das Objekt enthält falsche Werte.");
                    const Data = valid.filter(en => en.botid == parsed.botid)[0];
                    if (Data) return message.channel.send("Der Bot existiert bereits.");
                    valid.push(parsed);
                    let config = JSON.parse(fs.readFileSync('./config.json'));
                    config.bumpbots.push(parsed);
                    fs.writeFileSync('./config.json', JSON.stringify(config));
                    let momentdate = moment().add(parsed.interval.hours || 0, 'hours').add(parsed.interval.minutes || 0, 'minutes').add(parsed.interval.seconds || 0, 'seconds');
                    let date = new Date(momentdate).getTime();
                    await Database.Bumps.create({ botid: parsed.botid, nextbump: date, notification: false });
                    console.log(`Bot ${client.users.get(parsed.id).tag} wurde hinzugefügt.`);
                    return message.channel.send("Der Bot wurde erfolgreich hinzugefügt.");
                };
            } catch (err) {
                return message.channel.send("Bitte generiere eine richtiges Objekt mit <https://terax235.github.io/discord-bumpbot/assistant>.");
            };
        };
        if (!valid.filter(v => message.content.toLowerCase().startsWith(v.bumpcommand.toLowerCase()))[0]) return;
        if (!message.member.roles.has(config.bumprole)) return message.channel.send("Du besitzt nicht die Bumprolle.");
        let bot = valid.filter(v => message.content.toLowerCase().startsWith(v.bumpcommand.toLowerCase()))[0];
        const DBEntry = await Database.Bumps.findOne({ where: { botid: bot.botid }});
        if (!DBEntry.notification) return message.channel.send(`Der Bot / die Seite muss noch nicht gebumpt werden.`);
        let momentdate = moment().add(bot.interval.hours || 0, 'hours').add(bot.interval.minutes || 0, 'minutes').add(bot.interval.seconds || 0, 'seconds');
        let date = new Date(momentdate).getTime();
        await Database.Bumps.update({ notification: false, nextbump: date }, { where: { botid: bot.botid }});
        if (bot.website) return message.channel.send(`${message.author}, du hast erfolgreich ${bot.name || bot.website} gebumpt. :white_check_mark:`);
        return message.channel.send(`${message.author}, du hast erfolgreich <@${bot.botid}> gebumpt. :white_check_mark:`);
    });
});