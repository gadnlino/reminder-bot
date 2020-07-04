const awsSvc = require("./services/awsService.js");
const uuid = require("uuid");
const { default: Axios } = require('axios');
const dotenv = require("dotenv");

dotenv.config();

module.exports = {

  persistReminder: async (reminder) => {
    const { data, assunto, username, from_id,
      chat_id, file_path } = reminder;

    reminder = {
      body: assunto,
      creation_date: new Date().toISOString(),
      reminder_date: data.toISOString(),
      dismissed: false,
      uuid: uuid.v1(),
      username,
      from_id,
      chat_id,
      file_path
    };

    try {
      const resp = await awsSvc.sqs.sendMessage(
        process.env.PERSISTENCE_QUEUE_URL,
        JSON.stringify(reminder)
      );
    } catch (e) {
      throw e;
    }
  },

  searchReminders: async function () {
    const getMessagesResp = await awsSvc.sqs
      .getMessages(process.env.REMINDERS_QUEUE_URL);

    const messages = getMessagesResp.Messages;

    return messages && messages.map(m => m.Body) || null;
  },

  registerEmail: async (options) => {

    const { first_name, last_name, email, username } = options;

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
        "email": [email],
        "first_name": first_name,
        "last_name": last_name
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
  deregisterEmail: async (username) => {

    const { SUBSCRIPTIONS_TABLE_NAME } = process.env;

    await awsSvc.dynamodb.updateItem(
      SUBSCRIPTIONS_TABLE_NAME,
      { "username": username },
      "set email = :value",
      { ":value": [] }
    );
  },

  // uploadFile: async (fileStream, extension) => {
  //   const fileName = uuid.v1() + "." + extension;
  // },

  // downloadFile: async (downloadLink) => {
  //   const response = await Axios({ method: "GET", url: downloadLink, responseType: "stream" });

  //   return response.data;
  // }
}