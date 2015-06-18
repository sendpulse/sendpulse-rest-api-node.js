/*
 * SendPulse REST API Usage Example
 *
 * Documentation
 * https://login.sendpulse.com/manual/rest-api/
 * https://sendpulse.com/api
 */

var sendpulse = require("./api/sendpulse.js");

/*
 * https://login.sendpulse.com/settings/#api
 */

var API_USER_ID="USER_ID"
var API_SECRET="USER_SECRET"

var TOKEN_STORAGE="/tmp/"

sendpulse.init(API_USER_ID,API_SECRET,TOKEN_STORAGE);

/**
 * Function to process response data
 *
 * @param data
 */
var answerGetter = function answerGetter(data){
    console.log(data);
}

sendpulse.listAddressBooks(answerGetter);
sendpulse.createAddressBook(answerGetter,'My Book');
sendpulse.editAddressBook(answerGetter, 123456, 'My new book');
sendpulse.removeAddressBook(answerGetter, 123456);
sendpulse.getBookInfo(answerGetter,123456);
sendpulse.getEmailsFromBook(answerGetter,123456);
sendpulse.addEmails(answerGetter, 123456, [{email:'some@domain.com',variables:{}}]);
sendpulse.removeEmails(answerGetter, 123456, ['some@domain.com']);
sendpulse.getEmailInfo(answerGetter,123456,'some@domain.com');
sendpulse.campaignCost(answerGetter,123456);
sendpulse.listCampaigns(answerGetter,10,20);
sendpulse.getCampaignInfo(answerGetter,123456);
sendpulse.campaignStatByCountries(answerGetter,123456);
sendpulse.campaignStatByReferrals(answerGetter,123456);
sendpulse.createCampaign(answerGetter,'Alex','some@domain.com','Example subject','<h1>Example text</h1>',123456);
sendpulse.cancelCampaign(answerGetter,123456);
sendpulse.listSenders(answerGetter);
sendpulse.addSender(answerGetter,'Alex','some@domain.com');
sendpulse.removeSender(answerGetter,'some@domain.com');
sendpulse.activateSender(answerGetter,'some@domain.com','q1q1q1q1q1q1q1q1q1q1q1');
sendpulse.getSenderActivationMail(answerGetter,'some@domain.com');
sendpulse.getEmailGlobalInfo(answerGetter,'some@domain.com');
sendpulse.removeEmailFromAllBooks(answerGetter,'some@domain.com');
sendpulse.emailStatByCampaigns(answerGetter,'some@domain.com');
sendpulse.getBlackList(answerGetter);
sendpulse.addToBlackList(answerGetter,'some@domain.com','Comment');
sendpulse.removeFromBlackList(answerGetter,'some@domain.com');
sendpulse.getBalance(answerGetter,'USD');
sendpulse.smtpListEmails(answerGetter,10,20,undefined,undefined,undefined,'some@domain.com');
sendpulse.smtpGetEmailInfoById(answerGetter,'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1');
sendpulse.smtpUnsubscribeEmails(answerGetter,[{email:'some@domain.com',comment:'Comment'}]);
sendpulse.smtpRemoveFromUnsubscribe(answerGetter, ['some@domain.com']);
sendpulse.smtpListIP(answerGetter);
sendpulse.smtpListAllowedDomains(answerGetter);
sendpulse.smtpAddDomain(answerGetter,'some@domain.com');
sendpulse.smtpVerifyDomain(answerGetter,'some@domain.com');

var email = {
        "html" : "<h1>Example text</h1>",
        "text" : "Example text",
        "subject" : "Example subject",
        "from" : {
            "name" : "Alex",
            "email" : "some@domain.com"
        },
        "to" : [
            {
                "name" : "Piter",
                "email" : "some@domain.net"
            },
        ],
        "bcc" : [
            {
                "name" : "John",
                "email" : "some@domain.info"
            },
        ]
    };
sendpulse.smtpSendMail(answerGetter,email);
