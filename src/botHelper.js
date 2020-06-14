const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const awsSvc = require("./services/awsService.js");
const uuid = require("uuid");

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

    reminder = {
      body: assunto,
      creation_date: new Date().toISOString(),
      reminder_date: data.toISOString(),
      dismissed: false,
      uuid: uuid.v1(),
      username,
      from_id,
      chat_id
    };

    try {
      const resp = await awsSvc.sqs.sendMessage(
        queueUrl,
        JSON.stringify(reminder)
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

  deregisterEmail: async (email, username) => {

    const { SUBSCRIPTIONS_TABLE_NAME } = process.env;

    const queryResp = await awsSvc.dynamodb.queryItems(
      SUBSCRIPTIONS_TABLE_NAME,
      "#id = :value",
      { "#id": "username" },
      { ":value": username }
    );

    if (queryResp.Items.length === 1) {
      const item = queryResp.Items[0];

      const newEmails = item.email.filter(e => e !== email);

      if (newEmails.length > 0) {
        await awsSvc.dynamodb.updateItem(
          SUBSCRIPTIONS_TABLE_NAME,
          { "username": username },
          "set email = :value",
          { ":value": [] }
        );
      }
    }
  }
}