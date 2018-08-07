const Sequelize = require('sequelize');

const DB = new Sequelize({
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    operatorsAliases: false,
    define: {
        collate: 'utf8mb4_bin'
    },
    storage: './Database.sqlite',
});

let str = Sequelize.STRING(300);
let bol = Sequelize.BOOLEAN;

const Bumps = DB.define('bumps', { botid: str, nextbump: str, notification: bol });

class Database {
    constructor() {
        DB.sync();
        return DB;
    };
    static reset() {
        return DB.sync({ force: true });
    };
    static get Bumps() { return Bumps };
};

module.exports = Database;