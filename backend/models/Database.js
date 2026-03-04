const mysql = require('mysql2');

class Database {
    constructor() {
        if (!Database.instance) {
            this.connection = mysql.createPool({
                host: process.env.DB_HOST || 'db',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASS || 'rootpassword',
                database: process.env.DB_NAME || 'emotiloom_db'
            }).promise();
            Database.instance = this;
        }
        return Database.instance;
    }

    async query(sql, params) {
        return await this.connection.execute(sql, params);
    }
}

const instance = new Database();
module.exports = instance;