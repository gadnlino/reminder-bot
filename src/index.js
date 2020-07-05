const bot = require("./bot.js");
const awsSvc = require("./services/awsService");
const botHelper = require("./botHelper.js");
const scenes = require("./scenes/scenes.js");
const dotenv = require("dotenv");

dotenv.config();

try {
    bot.createStage([
        scenes.create_reminder,
        scenes.register_email,
        scenes.unregister_email
    ]);

    bot.createCommand("melembre", "create_reminder");
    bot.createCommand("email", "register_email");
    bot.createCommand("remover_email", "unregister_email");

    bot.init(process.env.RUNNING_LOCALLY &&
        process.env.RUNNING_LOCALLY.toLowerCase() === "true");

    setInterval(async () => {

        const messages = await botHelper.searchReminders();

        if (messages) {

            console.log(messages.length);
            
            messages.forEach(async message => {
                
                const { reminder, receiptHandle} = message;

                console.log("Sending reminder: " + JSON.stringify(reminder));
                const notification = `⏰⏰ Lembrete!!! : ${reminder.body} ⏰⏰`;
                bot.sendMessage(reminder.chat_id, notification);
                await awsSvc.sqs.deleteMessage(process.env.REMINDERS_QUEUE_URL, receiptHandle);
            });
        }

    }, parseInt(process.env.POLL_INTERVAL));
}
catch (e) {
    console.log(e.stack);
}