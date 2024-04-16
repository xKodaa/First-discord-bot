const bottomGuessGameInterval = 1;
const topGuessGameInterval = 5;

const commands = {
    AHOJ: {
        name: "ahoj",
        description: "Pozdraví uživatele."
    },
    HELP: {
        name: "help",
        description: "Zobrazí seznam dostupných příkazů a jejich popisky."
    },
    NAHODA: {
        name: "nahoda",
        description: "Vrátí náhodnou odpověď z předdefinovaného seznamu."
    },
    PRIDEJ_NAPAD: {
        name: "pridejnapad",
        description: "Přidá uživatelův nápad do seznamu."
    },
    NAPADY: {
        name: "napady",
        description: "Zobrazí seznam všech uložených nápadů."
    },
    SMAZ_NAPADY: {
        name: "smaznapady",
        description: "Smaže všechny uložené nápady."
    },
    HADEJ: {
        name: "hadej",
        description: `Zahrajeme si hádací hru, hádáš náhodné číslo od ${bottomGuessGameInterval} do ${topGuessGameInterval}`
    },
    STATUS_HRY: {
        name: "statushry",
        description: "Zobrazí skóre hádací hry" 
    },
    UPOMINKA: {
        name: "upominka",
        description: "Nastaví upomínku, formát: \`'-upominka 5s/5m/5h/5d zpráva'\`",
    }
};

module.exports = {
    commands,
    bottomGuessGameInterval,
    topGuessGameInterval
};