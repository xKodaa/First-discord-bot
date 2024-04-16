const { Client, Events, GatewayIntentBits } = require('discord.js');
const { readFile, writeFile } = require('fs/promises');
const utils = require('./utils.js');    
const config = require('./data/config.json');
const com = require('./data/commands.js');
const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,    
        GatewayIntentBits.MessageContent,  // důležité pro přístup k obsahu zpráv
        GatewayIntentBits.DirectMessages  // pokud chcete, aby bot reagoval i na DM
    ]
});
const prefix = "-";  //prefix bota
const mainChannelId = config.mainChannelId;
const validRoles = ["Extra sráči", "Největší sráč"];
const ideasFile = "data/ideas.json";
const guessGameFile = "data/guessGame.json";
const answersFile = "data/answers.json";
const commands = com.commands;
var actualChannel, user, userRole, roleNames, userHighestRole;

bot.login(config.token);

bot.on("ready", () => {
    utils.log("Bot byl zapnut");

    actualChannel = bot.channels.cache.find(channel => channel.id == mainChannelId);

    if (actualChannel) {
        utils.log(`kanál ${actualChannel.name} existuje, používám ho jako kanal pro commandy`)
        actualChannel.send("----------------------------------------------------------------------------")
        actualChannel.send("Kodak black mě zapl, sypej do mě commandy");
        printHelp();
    } else {
        console.error(`kanál ${actualChannel.name} nenalezen`);
    }
});

bot.on("messageCreate", message => { 
    if(!message.content.startsWith(prefix)) return; // pokud se message nerovná prefixu ("-"), tak jí ignoruj  
    if(message.author.bot) return; // pokud je autor zprávy bot, ignoruj ji

    user = message.member;
    userRole = user.roles.cache;
    userHighestRole = user.roles.highest;
    roleNames = userRole.map(role => role.name).join(', '); // Mapování rolí na jejich jména a spojení do řetězce

    let commandParts = message.content.slice(prefix.length).trim().split(/ +/);
    let commandName = commandParts[0].toLowerCase();  // command
    let messageContent = commandParts.slice(1).join(' '); // vše za commandem
    let messageLog = `Uživatel '${user.displayName}' role: (${roleNames}), nejvyšší role: '${userHighestRole.name}' poslal command '${commandName}' s hodnotou '${messageContent}'`
    utils.log(messageLog);
    
    handleMessage(commandName, message, messageContent);
})

function handleMessage(commandName, message, messageContent) {
    const command = Object.values(commands).find(cmd => cmd.name == commandName);
    if (command) {
        switch (command) {
            case commands.AHOJ:
                sayHello(message); 
                break;
            case commands.HELP:
                printHelp(); 
                break;
            case commands.NAHODA:
                sendRandomAnswer(message); 
                break;
            case commands.PRIDEJ_NAPAD:
                saveIdea(message, messageContent); 
                break;
            case commands.NAPADY:
                printIdeas(); 
                break;
            case commands.SMAZ_NAPADY:
                deleteIdeas(message); 
                break;
            case commands.HADEJ:
                guessNumber(message, messageContent); 
                break;
            case commands.STATUS_HRY:
                printGuessGameStatus(); 
                break;
            case commands.UPOMINKA:
                setReminder(message, messageContent); 
                break;
            default:
                utils.log(`Command ${commandName} nenalezen`); 
                break;
        }
    } else {
        actualChannel.send("Nepodporovaný příkaz, zkus příkaz '-help'");
    }
}

function sayHello(message) {
    message.reply("Sokeres more");
}

function setReminder(message, messageContent) {
    const parts = messageContent.split(/ (.+)/); // Rozdělí vstup na dva díly: čas a text upomínky
    if (parts.length < 2) {
        message.reply("Musíš zadat čas a text upomínky, například '-upominka 5m chálka'");
        return;
    }

    // Konverze intervalu na milisekundy
    const timeMultipliers = {
        's': 1000,        // sekundy
        'm': 60000,       // minuty
        'h': 3600000,     // hodiny
        'd': 86400000     // dny
    };

    // Extrahuje číselnou hodnotu a jednotku času (např. "5m" => 5 a "m")
    const match = interval.match(/(\d+)(s|m|h|d)/);
    if (!match) {
        message.reply("Špatný formát času. Použij formát jako 5s, 5m, 5h, nebo 5d.");
        return;
    }

    const [, count, unit] = match;
    const duration = parseInt(count, 10) * timeMultipliers[unit];
    message.reply(`Upomínka nastavena, za ${interval} ti přijde zpráva`);

    setTimeout(() => {
        user.send(`Tvá nastavená upomínka: ${reminderText}`);
    }, duration);
}

async function printGuessGameStatus(message) {
    try {
        const data = await readFile(guessGameFile, 'utf8');
        const scores = JSON.parse(data);
        let scoreMessage = "Stav hry **Hádej číslo**:\n";

        for (const [gameUser, score] of Object.entries(scores)) {
            scoreMessage += `**${gameUser}**: ${score} výhr${(score == 1) ? 'a' : ((score < 5) ? 'y' : 'er')}\n`;
        }

        actualChannel.send(scoreMessage.length > 0 ? scoreMessage : "Zatím nebyly zaznamenány žádné výhry.");
    } catch (err) {
        console.error("Error accessing the guess game file:", err);
        actualChannel.send("Nepodařilo se načíst data o hře.");
    }
}

function guessNumber(message, messageContent) {
    if (messageContent == "") {
        message.reply("Musíš zadat číslo ty kokot");
        return;
    }
    // Generuje náhodné číslo od 1 do 20
    const randomNumber = Math.floor(Math.random() * com.topGuessGameInterval) + com.bottomGuessGameInterval;  
    const guessedNumber = parseInt(messageContent, 10);

    if (guessedNumber == randomNumber) {
        updateGuessGameFile(user.displayName);
        message.reply(`Gratuluji! Uhodl jsi správné číslo ${randomNumber}.`);
    } else {
        message.reply(`Smůla, správné číslo bylo ${randomNumber}. Zkus to znovu!`);
    }
}

async function updateGuessGameFile(username) {
    try {
        let data;
        try {
            data = await readFile(guessGameFile, 'utf8'); 
        } catch (err) {
            if (err.code === 'ENOENT') {
                // Soubor neexistuje, vytoří se nový
                let scores = { [username]: 1 };
                await writeFile(guessGameFile, JSON.stringify(scores, null, 4));
                utils.log(`Výhra uživatele ${username} byla zapsána.`);
                return;
            } else {
                utils.logError(err);
            }
        }
        // Soubor existuje, přidají se do něj data
        const scores = JSON.parse(data);
        scores[username] = (scores[username] || 0) + 1; // inkrementace nebo inicializace na 0
        await writeFile(guessGameFile, JSON.stringify(scores, null, 4));
        utils.log(`Výhra uživatele ${username} byla aktualizována.`);

    } catch (err) {
        utils.logError(`Nastala chyba při aktualizaci souboru s hrami: ${err.message}`);
    }
}

async function printIdeas(message) {
    try {
        const data = await readFile(ideasFile, 'utf8');
        const ideas = JSON.parse(data);
        if (ideas.length === 0) {
            actualChannel.send("Zatím nebyly přidány žádné nápady.");
        } else {
            let answer = "Seznam nápadů:\n";
            ideas.forEach((idea, index) => {
                answer += `${index + 1}. ${idea}\n`;
            });
            actualChannel.send(answer);
        }
    } catch (err) {
        console.error("Error reading file:", err);
        actualChannel.send("Nepodařilo se načíst nápady.");
    }
}

async function deleteIdeas(message) {
    if (!validRoles.includes(userHighestRole.name)) {
        message.reply("Nemáš oprávnění použít tento příkaz.");
        return;
    }

    try {
        await writeFile(ideasFile, JSON.stringify([]));
        actualChannel.send("Všechny nápady byly úspěšně smazány.");
    } catch (err) {
        console.error("Error writing file:", err);
        actualChannel.send("Nepodařilo se smazat nápady.");
    }
}

async function saveIdea(message, messageContent) {
    try {
        let data;
        try {
            data = await readFile(ideasFile, 'utf8'); 
        } catch (err) {
            if (err.code === 'ENOENT') {
                // Soubor neexistuje, vytoří se nový
                await writeFile(ideasFile, JSON.stringify([messageContent]));
                utils.log(`první nápad ${messageContent} byl uložen.`);
                message.reply("První nápad byl uložen.");
                return;
            } else {
                utils.logError(err);
            }
        }

        // Soubor existuje, přidají se do něj data
        const ideas = JSON.parse(data);
        ideas.push(messageContent);
        await writeFile(ideasFile, JSON.stringify(ideas));
        message.reply("Ty si vymejšlíš pičoviny moreee, ale tak uložím ho no, co mám s tebou dělat.");
        actualChannel.send("Nápady vypíšeš pomocí **-napady**");
        utils.log(`Nápad ${messageContent} byl přidán do souboru ${ideasFile}`);
    } catch (err) {
        utils.logError("Error handling the ideas file:", err);
        actualChannel.send("Došlo k problému při ukládání nápadu.");
    }
}

async function sendRandomAnswer(message) {
    const data = await readFile(answersFile, 'utf8'); 
    const json = JSON.parse(data); 
    const randomAnswers = json.answers; 
    let randomAnswer = randomAnswers[Math.floor(Math.random() * randomAnswers.length)];
    message.reply(randomAnswer);
}

function printHelp() {
    let helpText = `Dostupné příkazy: (Všechny lzou používat pouze v kanále ${actualChannel})\n`;
    for (const key in commands) {
        let command = commands[key];
        helpText += `**-${command.name}**: \t${command.description}\n`;
    }
    actualChannel.send(helpText);
}