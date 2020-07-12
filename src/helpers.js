const awsSvc = require("./services/awsService.js");
const uuid = require("uuid");
const { default: Axios } = require('axios');
const config = require("./config.js");

module.exports = {

  persistReminder: async (reminder) => {
    const {
      data,
      assunto,
      username,
      from_id,
      chat_id,
      file_path
    } = reminder;

    try {
      await awsSvc.sqs.sendMessage(config.persistenceQueueUrl,
        JSON.stringify({
          body: assunto,
          creation_date: new Date().toISOString(),
          reminder_date: data.toISOString(),
          dismissed: false,
          uuid: uuid.v1(),
          username,
          from_id,
          chat_id,
          file_path
        }));
    } catch (e) {
      throw e;
    }
  },

  searchReminders: async function () {
    const getMessagesResp = await awsSvc.sqs
      .getMessages(config.remindersQueueUrl);

    const messages = getMessagesResp.Messages;

    return messages && messages.map(m => ({
      reminder: JSON.parse(m.Body),
      receiptHandle: m.ReceiptHandle
    })) || null;
  },

  sendEmailMessage: async (options) => {
    const { type, parameters, recipientEmail } = options;

    await awsSvc.sqs.sendMessage(config.emailQueueUrl, JSON.stringify({
      type,
      recipientEmail,
      parameters
    }));
  },

  getUserEmail: async (username) => {
    const queryResp = await awsSvc.dynamodb.queryItems(
      config.subscriptionsTableName,
      "#id = :value",
      { "#id": "username" },
      { ":value": username }
    );

    if (queryResp.Items.length === 0)
      return null

    return queryResp.Items[0].email;
  },

  registerEmail: async (options) => {

    const { first_name, last_name, email, username } = options;

    const queryResp = await awsSvc.dynamodb.queryItems(
      config.subscriptionsTableName,
      "#id = :value",
      { "#id": "username" },
      { ":value": username }
    );

    if (queryResp.Items.length === 0) {

      const item = {
        "username": username,
        "email": [email],
        "first_name": first_name,
        "last_name": last_name
      };

      await awsSvc.dynamodb.putItem(config.subscriptionsTableName, item);
    }
    else if (queryResp.Items.length === 1) {
      const item = queryResp.Items[0];

      if (!item.email.includes(email)) {
        const newEmail = [...item.email, email];

        await awsSvc.dynamodb.updateItem(
          config.subscriptionsTableName,
          { "username": username },
          "set email = :value",
          { ":value": newEmail }
        );
      }
    }
  },

  deregisterEmail: async (username) => {

    await awsSvc.dynamodb.updateItem(
      config.subscriptionsTableName,
      { "username": username },
      "set email = :value",
      { ":value": [] }
    );
  }
}