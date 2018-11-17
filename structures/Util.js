const Database = require('./Database.js');
const config = require('../config.json');
class Util {
    static async toBump(configbots) {
        const Entries = await Database.Bumps.findAll({ where: { nextbump: { [require('sequelize').Op.lte] : Date.now() }, notification: false }});
        if (Entries[0]) {
            for (var entry of Entries) {
                let bot = configbots.filter(bot => bot.botid == entry.botid)[0];
                if (!bot) return await Database.Bumps.destroy({ where: { botid: entry.botid }});
                await Database.Bumps.update({ notification: true }, { where: { botid: DBEntry.botid }});
                if (!bot.bumpcommand) return await Database.Bumps.destroy({ where: { botid: entry.botid }});
                if (bot.website) return client.channels.get(configbots.bumpchannel).send(`${client.roles.get(config.bumprole) || 'Bumpteam'}, es ist an der Zeit, für die Webseite <${bot.website}> zu bumpen. Benutze \`${bot.bumpcommand}\` im Anschluss, um den Bump zu bestätigen.`);
                if (!client.users.get(bot.botid)) return await Database.Bumps.destroy({ where: { botid: entry.botid }});
                return client.channels.get(configbots.bumpchannel).send(`${client.roles.get(config.bumprole) || 'Bumpteam'}, es ist an der Zeit, für den Bot ${client.users.get(bot.botid)} zu bumpen. Benutze \`${bot.bumpcommand}\`.`);
            };
        };
    };
};

module.exports = Util;