const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const awsSvc = require("./services/awsService.js");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new Telegraf(TELEGRAM_TOKEN);

module.exports = {

  sendReminderToUser: async (reminder) => {

    bot.telegram
      .sendMessage(reminder.chat_id, `⏰⏰Lembrete!!! : ${reminder.body}⏰⏰`,
        Extra.markup(Markup.inlineKeyboard([
          Markup.callbackButton('Já lembrei!', reminder.uuid, true)
        ])));
  },

  sendReminderToQueue: async (reminder, queueUrl) => {
    const { data, assunto, username, from_id, chat_id } = reminder;

    const now = new Date();

    const id = uuid.v1();
    const reminder_date = new Date(data);
    reminder_date.setSeconds(now.getSeconds());
    reminder_date.setMinutes(now.getMinutes());
    reminder_date.setHours(now.getHours());

    reminder = {
      body: assunto,
      creation_date: now.toISOString(),
      reminder_date: reminder_date.toISOString(),
      dismissed: false,
      uuid: id,
      username,
      from_id,
      chat_id
    };

    const reminderStr = JSON.stringify(reminder);

    try {
      const resp = await awsService.sqs.sendMessage(
        queueUrl,
        reminderStr
      );

    } catch (e) {
      throw e;
    }
  },

  registerEmail: async (email, username) => {

    const { SUBSCRIPTIONS_TABLE_NAME } = process.env;

    const queryResp = await awsSvc.dynamodb.queryItems(
      SUBSCRIPTIONS_TABLE_NAME,
      "#id = :value",
      { "#id": "username" },
      { ":value": username }
    );

    if (queryResp.Items.length === 0) {
      const item = {
        "username": username,
        "email": [email]
      };

      await awsSvc.dynamodb.putItem(SUBSCRIPTIONS_TABLE_NAME, item);
    }
    else if (queryResp.Items.length === 1) {
      const item = queryResp.Items[0];

      if (!item.email.includes(email)) {
        const newEmail = [...item.email, email];

        await awsSvc.dynamodb.updateItem(
          SUBSCRIPTIONS_TABLE_NAME,
          { "username": username },
          "set email = :value",
          { ":value": newEmail }
        );
      }
    }
  },

  deregisterEmail : async (email, username)=>{
    
    const { SUBSCRIPTIONS_TABLE_NAME } = process.env;

    const queryResp = await awsSvc.dynamodb.queryItems(
      SUBSCRIPTIONS_TABLE_NAME,
      "#id = :value",
      { "#id": "username" },
      { ":value": username }
    );

    if (queryResp.Items.length === 1) {
      const item = queryResp.Items[0];

      const newEmails = item.email.filter(e=>e !== email);

      if(newEmails.length === 0){

        

      }
      else{
        
        await awsSvc.dynamodb.updateItem(
          SUBSCRIPTIONS_TABLE_NAME,
          { "username": username },
          "set email = :value",
          { ":value": newEmail }
        );

      }
    }
  }
}