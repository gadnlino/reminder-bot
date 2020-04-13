const AWS = require("aws-sdk");
const sqs = new AWS.SQS({region: "us-east-1"});
const credentials = new AWS.SharedIniFileCredentials();
AWS.config.credentials = credentials;

module.exports = (lembrete) => {

    console.log(lembrete);

    const params = {
        QueueUrl : process.env.PERSISTENCE_QUEUE_URL,
        MessageBody : JSON.stringify(lembrete)
    };    

    sqs.sendMessage(params,(err,data)=>{
        if(err){
            console.log(err);
        }
        else{
            console.log(data);
        }
    });
};