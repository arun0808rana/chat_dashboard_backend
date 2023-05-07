const pool = require('../db')

async function addUser(user) {
    const { username, password, email } = user;
    let User = await findUserByUsername(username);
    // console.log('Usr', User);

    if (!User) {
        try {
            await new Promise((resolve, reject) => {
                pool.query(`INSERT INTO users (username, password, email) VALUES ($1, $2, $3)`, [username, password, email], (err, res) => {
                    if (err) {
                        console.error('[Error]: adding user: ', err.message);
                        reject();
                    } else {
                        console.log(`[New user] ${username} added.`);
                        // console.log('res', res)
                        return findUserByUsername(username);
                    }
                    // pool.end(); // close the pool after the query is executed
                    resolve();
                });
            })
        } catch (error) {
            handleError(error);
            return user;
        }
    } else {
        console.log('User Already Exists.');
        return User;
    }
}

async function addMessages(senderUsername, recipientUsername, message) {
    const Sender = await findUserByUsername(senderUsername);
    const Recipient = await findUserByUsername(recipientUsername);
    // console.log('Sender', Sender)

    if (Sender && Recipient) {
        pool.query(`INSERT INTO messages (sender_id, recipient_id, content) VALUES ($1, $2, $3)`, [Sender.id, Recipient.id, message], (err, res) => {
            if (err) {
                console.error('[Error]: adding message: ', err.message);
            } else {
                console.log(`[New message] added.`);
                // console.log('res', res)
                return res;
            }
        });
    } else {
        if(!Sender){

            console.error('Couldnt find sender');
        }
        if(!Recipient){
            console.error('Couldnt find recipient');
        }
    }
}

function handleError(error) {
    console.error('[Error]:', error?.message)
}

async function findUserByUsername(username) {
    return await new Promise((resolve, reject) => {
        try {
            pool.query(`SELECT * FROM users WHERE username=$1`, [username], (err, res) => {
                if (err) {
                    console.error('[Error]: finding user', err.message);
                } else if (res.rows.length === 0) {
                    console.log(`User with username ${username} not found`);
                    resolve(null);
                } else {
                    // console.log(`Found:`, res.rows[0]);
                    resolve(res.rows[0]);
                }
                // pool.end(); // close the pool after the query is executed
            });
        } catch (error) {
            handleError(error);
            reject(null);
        }
    })
}

async function getChatHistory(user_id, friend_id) {
    console.log('user_id, friend_id', user_id, friend_id, 'hel');
        return await new Promise((resolve, reject) => {
            try {
                pool.query(`SELECT * FROM messages WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)`, [user_id, friend_id], (err, res) => {
                    // console.log('res', res.rows)
                    if (err) {
                        console.error('[Error]: finding chat history', err.message);
                        reject([])
                    } else if (res.rows.length === 0) {
                        console.log(`Messages could not found`);
                        reject([]);
                    } else {
                        // console.log(`Found:`, res.rows[0]);
                        resolve(res.rows);
                    }
                    // pool.end(); // close the pool after the query is executed
                });
            } catch (error) {
                handleError(error);
                reject([]);
            }
        })
}


async function getUserChatsList(user_id) {
    // const query = `SELECT friend_id, MAX(timestamp) AS created_at
    // FROM (
    //   SELECT friend_id, timestamp
    //   FROM messages
    //   WHERE username = ${username}
    //     AND friend_id IN (SELECT UNNEST(friends) FROM users WHERE username = ${username})
    //   ORDER BY timestamp DESC
    // ) AS messages
    // GROUP BY friend_id
    // ORDER BY created_at DESC;
    // `;

    // const query = `SELECT users.username AS username, messages.content AS last_message, MAX(messages.created_at) AS created_at
    // FROM messages
    // JOIN users ON (messages.sender_id = users.id OR messages.recipient_id = users.id)
    // WHERE (messages.sender_id = ${user_id} OR messages.recipient_id = ${user_id})
    //   AND users.id != ${user_id}
    // GROUP BY users.id, users.username, messages.content
    // ORDER BY created_at DESC;
    // `;

    const query = `
    SELECT users.id AS user_id, users.username AS username, messages.content AS last_message, messages.created_at
FROM (
  SELECT 
    CASE 
      WHEN sender_id = $1 THEN recipient_id 
      ELSE sender_id 
    END AS other_user_id,
    MAX(created_at) AS max_created_at
  FROM messages
  WHERE sender_id = $1 OR recipient_id = $1
  GROUP BY CASE 
    WHEN sender_id = $1 THEN recipient_id 
    ELSE sender_id 
  END
) latest_messages
JOIN messages ON (
  (messages.sender_id = $1 AND messages.recipient_id = latest_messages.other_user_id) OR
  (messages.recipient_id = $1 AND messages.sender_id = latest_messages.other_user_id)
) AND messages.created_at = latest_messages.max_created_at
JOIN users ON users.id = latest_messages.other_user_id
ORDER BY messages.created_at DESC;
    `;
    const placeholder = [user_id];

    return await new Promise((resolve, reject) => {
        try {
            pool.query(query, placeholder, (err, res) => {
                // console.log('res', res.rows)
                if (err) {
                    console.error('[Error]: finding user chat list: ', err.message);
                } else if (res.rows.length === 0) {
                    console.log(`User has no chats yet.`);
                    resolve([]);
                } else {
                    // console.log(`Found:`, res.rows[0]);
                    resolve(res.rows);
                }
                // pool.end(); // close the pool after the query is executed
            });
        } catch (error) {
            handleError(error);
            reject([]);
        }
    });
}

module.exports = {
    addUser,
    addMessages,
    getChatHistory,
    getUserChatsList
}