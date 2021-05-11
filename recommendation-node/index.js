// pubsub
require('dotenv').config()
const { PubSub } = require('@google-cloud/pubsub');
const pubSubClient = new PubSub({ projectId: 'treasurebox-313320' });

async function addNewUser(userId) {
    const topic = pubSubClient.topic(userId);
    topic.exists(async (err, exists) => {
        if (!exists) {
            await pubSubClient.createTopic(userId);
        }

        const [subscription] = await topic.createSubscription(userId);

        subscription.on('message', message => {
            console.log('Received message:', message.data.toString());
        });
    });
}

async function main() {
    await addNewUser('topic1');
    await addNewUser('topic2');
}

main()