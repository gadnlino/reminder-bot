const bot = require("./bot.js");
const awsSvc = require("./services/awsService");
const botHelper = require("./botHelper.js");
const scenes = require("./scenes/scenes.js");

try {
    bot.createStage([
        scenes.create_reminder,
        scenes.register_email,
        scenes.unregister_email
    ]);

    bot.createCommand("melembre", "create_reminder");
    bot.createCommand("email", "register_email");
    bot.createCommand("remover_email", "unregister_email");

    setInterval(async () => {

        const reminders = await botHelper.searchReminders();

        if (reminders) {
            reminders.forEach(async reminder => {

                console.log("Sending reminder: " + JSON.stringify(reminder.body));
                const notification = `⏰⏰ Lembrete!!! : ${reminder.body} ⏰⏰`;
                bot.sendMessage(reminder.chat_id, notification);
                await awsSvc.sqs.deleteMessage(REMINDERS_QUEUE_URL, message.ReceiptHandle);
            });
        }

    }, parseInt(process.env.POLL_INTERVAL));

    bot.init(process.env.RUNNING_LOCALLY &&
        process.env.RUNNING_LOCALLY.toLowerCase() === "true");
}
catch (e) {
    console.log(e.stack);
}