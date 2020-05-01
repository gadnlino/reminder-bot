const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const awsSvc = require("./services/awsService.js");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new Telegraf(TELEGRAM_TOKEN);

bot.on('callback_query', async ctx => {
    const uuid = ctx.update.callback_query.data;

    const response = await awsSvc.dynamodb.updateItem(remindersTableName, {
        "uuid": uuid
    },
        "set dismissed= :d",
        {
            ":d": true
        });

    if (response.$response.httpResponse.statusCode === 200) {
        ctx.reply("Lembrete apagado");
    }
});

module.exports = {

    sendReminder: async (reminder) => {
        
        bot.telegram
            .sendMessage(reminder.chat_id, `Lembrete : ${reminder.body}`,
                Extra.markup(Markup.inlineKeyboard([
                    Markup.callbackButton('Já lembrei!', reminder.uuid)
                ])));
    }
}