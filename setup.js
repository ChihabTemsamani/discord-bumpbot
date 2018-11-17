const { prompt } = require('inquirer');
const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client({ disableEveryone: true, autoReconnect: true });
let answers1;

function merge_objects(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
};
let config = {};
try {
    config = require('./config.json');
} catch (err) {
    fs.writeFileSync('./config.json', '{}');
};

prompt([
        {
            type: 'input',
            name: 'bot_token',
            message: 'Discord Bot Token',
            prefix: '-',
            suffix: ':',
            default: function() {
                if (config.bot_token) return config.bot_token;
                return undefined;
            },
            validate: async function (input) {
                var done = this.async();
                try {
                    console.log("\nLogin wird versucht...");
                    await client.login(input);
                } catch (err) {
                    console.log('Ungültiger Token.');
                    process.exit(1);
                };
                console.log("Login erfolgreich!");
                await done(null, true);
            },
        },
        {
            type: 'input',
            name: 'prefix',
            message: 'Prefix',
            prefix: '-',
            suffix: ':',
            default: function() {
                if (config.prefix) return config.prefix;
                return 'mention';
            },
            validate: function (input) {
                var done = this.async();
                if (input && input.length > 10) return done('Der Prefix sollte aus nicht mehr als 10 Zeichen bestehen.');
                done(null, true);
            },
        },
        {
            type: 'list',
            name: 'guild',
            message: 'Wähle den Server, auf dem der Bot arbeiten soll.',
            prefix: '-',
            suffix: ':',
            choices: async function() {
                let filtered = client.guilds;
                if (!filtered.first()) {
                    console.log("Der Bot ist auf keinem Server. Füge den Bot mit diesem Link auf einen Server hinzu:");
                    const invite = await client.generateInvite(3072);
                    console.log(invite);
                    process.exit(1);
                };
                if (config.guild) {
                    let g = client.guilds.get(config.guild);
                    if (g) {
                        filtered = filtered.filter(guild => guild.id != g.id).map(guild => guild.name + " (" + guild.id + ")").sort();
                        filtered.unshift(g.name + " (" + g.id + ")\n");
                        return filtered;
                    };
                };
                return filtered.map(guild => guild.name + " (" + guild.id + ")").sort();
            },
        },
]).then(answers => {
    if (answers.prefix == 'mention') answers.prefix = null;
    answers.guild = answers.guild.split('(')[answers.guild.split('(').length-1].split(')')[0];
    answers1 = answers;
}).then(() => {
    prompt([
        {
            type: 'list',
            name: 'bumprole',
            message: 'Wähle die Bumprolle aus',
            prefix: '-',
            suffix: ':',
            choices: function() {
                let filtered = client.guilds.get(answers1.guild).roles.filter(role => role.mentionable).filter(role => role.name != '@everyone');
                if (!filtered.first()) {
                    console.log("Es wurde keine Rolle gefunden, die erwähnt werden kann. Bitte stelle ein, dass man die Bump-Rolle erwähnen kann.");
                    process.exit(1);
                };
                if (config.bumprole) {
                    let role = client.guilds.get(answers1.guild).roles.get(config.bumprole);
                    if (role) {
                        filtered = filtered.filter(r => r.id != role.id).map(r => r.name + " (" + r.id + ")").sort();
                        filtered.unshift(role.name + " (" + role.id + ")\n");
                        return filtered;
                    };
                };
                return filtered.map(r => r.name + " (" + r.id + ")").sort();
            },
        },
        {
            type: 'list',
            name: 'bumpchannel',
            message: 'Wähle den Bumpkanal aus',
            prefix: '-',
            suffix: ':',
            choices: function() {
                let filtered = client.guilds.get(answers1.guild).channels.filter(channel => channel.permissionsFor(channel.guild.me).has(['VIEW_CHANNEL', 'SEND_MESSAGES'])).filter(channel => channel.type == 'text');
                if (!filtered.first()) {
                    console.log("Es wurde kein Kanal gefunden, in den der Bot schreiben kann. Bitte gib dem Bot die Berechtigungen, im Bump-Kanal Nachrichten zu versenden.");
                    process.exit(1);
                };
                if (config.bumpchannel) {
                    let c = client.guilds.get(answers1.guild).channels.get(config.bumpchannel);
                    if (c) {
                        filtered = filtered.filter(channel => channel.id != c.id).map(channel => channel.name + " (" + channel.id + ")").sort();
                        filtered.unshift(c.name + " (" + c.id + ")\n");
                        return filtered;
                    };
                };
                return filtered.map(channel => channel.name + " (" + channel.id + ")").sort();
            },
        }
    ]).then(async answers => {
        answers.bumprole = answers.bumprole.split('(')[answers.bumprole.split('(').length-1].split(')')[0];
        answers.bumpchannel = answers.bumpchannel.split('(')[answers.bumpchannel.split('(').length-1].split(')')[0];
        let final = await merge_objects(answers1, answers);
        await fs.writeFileSync('./config.json', JSON.stringify(final));
        config = final;
        console.log("Die Konfiguration wurde gespeichert. Du kannst sie jederzeit mit diesem Skript ändern.");
    }).then(async () => {
        while (true) {
            await prompt([{
                type: 'verify',
                name: 'next',
                message: 'Möchtest du einen (weiteren) Bot oder eine (weitere) Seite hinzufügen? (y/n)',
                prefix: '',
            }]).then(async answers => {
                let conf = await fs.readFileSync("./config.json", { encoding: "utf8" });
                conf = JSON.parse(conf);
                if (!conf.bumpbots) conf.bumpbots = [];
                if (answers.next.toLowerCase() != 'y') {
                    fs.writeFileSync('./config.json', JSON.stringify(conf));
                    console.log("Setup erfolgreich abgeschlossen.");
                    return process.exit(0);
                };
                await prompt([
                    {
                        type: 'input',
                        name: 'botoweb',
                        message: 'Möchtest du einen Bot oder eine Webseite hinzufügen? (B/W)',
                        prefix: '-',
                        validate: function(input) {
                            var done = this.async();
                            if (!input) return done('Bitte gib eine Option an.');
                            if (input.toLowerCase() != 'b' && input.toLowerCase() != 'w') return done('Mögliche Optionen: B, W');
                            done(null, true);
                        },
                    },
                    {
                        type: 'list',
                        name: 'botid',
                        message: 'Bitte wähle aus, welchen Bot du hinzufügen willst.',
                        prefix: '-',
                        choices: async function() {
                            await client.guilds.get(answers1.guild).fetchMembers();
                            let bots = client.guilds.get(answers1.guild).members.filter(m => m.user.bot).filter(m => m.id != client.user.id);
                            if (!bots.first()) {
                                console.log("Auf dem Server ist kein Bot. Bitte füge Bumpbots hinzu.");
                                return process.exit(1);
                            };
                            if (config.bumpbots && config.bumpbots[0] && config.bumpbots.filter(bot => bot.botid)) {
                                var blacklist = [];
                                for (var bumpbot of config.bumpbots) {
                                    blacklist.push(bumpbot.botid);
                                };
                                return bots.filter(bot => !blacklist.includes(bot.user.id)).map(bot => `${bot.user.tag} (${bot.user.id})`).sort();
                            };
                            return bots.map(bot => `${bot.user.tag} (${bot.user.id})`).sort();
                        },
                        when: function(answers) {
                            return answers.botoweb.toLowerCase() == 'b';
                        },
                    },
                    {
                        type: 'input',
                        name: 'interval',
                        message: 'Bumpinterval in Stunden:Minuten > ',
                        prefix: '-',
                        validate: function (input) {
                            var done = this.async();
                            if (!input) return done('Bitte gib eine Zeit als Bumpinterval im Format HH:MM an.');
                            if (input.split(':')[0] == input) {
                                let hours = input;
                                if (isNaN(hours)) return done('Gib eine Zahl an.');
                                done(null, true);
                            };
                            if (isNaN(input.split(':')[0]) || isNaN(input.split(':')[1])) return done('Gib eine Zahl an.');
                            done(null, true);
                        },
                    },
                    {
                        type: 'input',
                        name: 'bumpcommand',
                        message: 'Befehl, den der Bot zum Bumpen nutzt:',
                        prefix: '-',
                        validate: function (input) {
                            var done = this.async();
                            if (!input) return done('Bitte gib einen Befehl an.');
                            done(null, true);
                        },
                    },
                    {
                        type: 'input',
                        name: 'website',
                        message: 'Link zur Bumpseite:',
                        prefix: '-',
                        validate: function (input) {
                            var done = this.async();
                            if (!input) return done('Bitte gib einen Link an.');
                            done(null, true);
                        },
                        when: function(answers) {
                            return answers.botoweb.toLowerCase() == 'w';
                        },
                    }
                ]).then(async answers => {
                    if (!conf.bumpbots) conf.bumpbots = [];
                    if (answers.botoweb.toLowerCase() == 'b') {
                        answers.botid = answers.botid.split('(')[answers.botid.split('(').length-1].split(')')[0];
                        let exists = conf.bumpbots.filter(bot => bot.botid == answers.botid)[0];
                        if (exists) {
                            console.log("y")
                            conf.bumpbots = conf.bumpbots.filter(bot => bot.botid != answers.botid);
                        };
                    };
                    if (answers.botoweb.toLowerCase() == 'w') {
                        let exists = conf.bumpbots.filter(bot => bot.website == answers.website)[0];
                        if (exists) {
                            conf.bumpbots = conf.bumpbots.filter(bot => bot.website != answers.website);
                        };
                    };
                    answers.botoweb = undefined;
                    conf.bumpbots.push(answers);
                    console.log(`Erfolgreich hinzugefügt.`);
                });
            });
        };
    });
});