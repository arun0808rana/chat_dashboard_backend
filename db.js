const { Pool } = require('pg');

let pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '94174864889',
    port: 5432,
});

const db_name = 'chat_app_db';
const user_name = 'chat_app_user';
const pswd = '94174864889';

function createUser() {
    return new Promise((resolve, reject) => {
        try {
            pool.query(`CREATE USER "${user_name}" WITH PASSWORD '${pswd}'`, (err, res) => {
                if (err) {
                    console.error('[Error]: creating user: ', err.message);
                } else {
                    console.log('User created or already exists');
                    pool.end();
                    pool = new Pool({
                        user: user_name,
                        host: 'localhost',
                        database: db_name,
                        password: '94174864889',
                        port: 5432,
                    });
                }
                resolve();
            });
        } catch (error) {
            reject('[Error] while creating user: ', error?.message);
        }
    })
}


function createDatabase() {
    return new Promise((resolve, reject) => {
        try {
            // Create the database if it does not exist
            pool.query(`CREATE DATABASE ${db_name}`, (err, res) => {
                if (err) {
                    console.error('[Error]: creating database: ', err.message);
                } else {
                    console.log('Database created or already exists');
                }
                resolve();
            });
        } catch (error) {
            reject('[Error] while creating database; ', error?.message);
        }
    })
}



function grantPriveleges() {
    return new Promise((resolve, reject) => {
        try {
            // Grant privileges to the user
            pool.query(`GRANT ALL PRIVILEGES ON DATABASE ${db_name} TO ${user_name}`, (err, res) => {
                if (err) {
                    console.error('[Error]: granting previleges: ', err.message);
                } else {
                    console.log('Privileges granted to user');
                }
                resolve();
            });
        } catch (error) {
            reject(error?.message);
        }
    })
}

function createUserTable() {
    // Create the users table if it does not exist
    const query = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    friends VARCHAR(255)[]
  );
`;
    return new Promise((resolve, reject) => {
        try {
            pool.query(query, (err, res) => {
                if (err) {
                    console.log('[ERROR] creating users table: ', err?.message);
                } else {
                    console.log('Users table created successfully.');
                }
                resolve();
            });
        } catch (error) {
            reject(error?.message);
        }
    })
}

function createMessagesTable() {
    // create the messages table if it does not exist
    const query = `
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  recipient_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  media_address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT at_least_one_field_not_null CHECK (content IS NOT NULL OR media_address IS NOT NULL)
);
`;
    return new Promise((resolve, reject) => {
        try {
            pool.query(query, (err, res) => {
                if (err) {
                    console.log('[Error] creating messages table: ', err);
                } else {
                    console.log('Message table created successfully');
                }
                resolve();
            });
        } catch (error) {
            reject(error?.message);
        }
    })
}

(async () => {
    try {
        await createUser();
        await createDatabase();
        await grantPriveleges();
        await createUserTable();
        await createMessagesTable();
    } catch (error) {
        console.log('[Error]==>', error?.message);
    }
})()


module.exports = pool;
