require('dotenv').config();
let { MongoClient } = require('mongodb');

async function connect(collection) {
    let client = new MongoClient(process.env.DB_LOCALHOST);
    await client.connect();
    let sharedSchedule = client.db('shared-schedule');
    let collections = sharedSchedule.collection(`${collection}`);

    return collections;
}

module.exports = { connect };