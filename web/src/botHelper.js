const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const awsSvc = require("./services/awsService.js");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new Telegraf(TELEGRAM_TOKEN);

module.exports = {

    sendReminder: async (reminder) => {
        
        bot.telegram
            .sendMessage(reminder.chat_id, `Lembrete : ${reminder.body}`,
                Extra.markup(Markup.inlineKeyboard([
                    Markup.callbackButton('Já lembrei!', reminder.uuid, true)
                ])));
    }
}