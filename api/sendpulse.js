/*
 * Sendpulse REST API Node.js class
 *
 * Documentation
 * https://login.sendpulse.com/manual/rest-api/
 * https://sendpulse.com/api
 *
 */


'use strict';

var https = require('https');
var crypto = require('crypto');
var fs = require('fs');

var API_URL = 'api.sendpulse.com';
var API_USER_ID = '';
var API_SECRET = '';
var TOKEN_STORAGE = '';
var TOKEN = '';

var ERRORS = {
    INVALID_TOKEN: 'Invalid token',
    INVALID_RESPONSE: 'Bad response from server',
    INVALID_CREDENTIALS: 'Invalid credentials',
};

/**
 * MD5
 *
 * @param data
 * @return string
 */
function md5(data) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(data);
    return md5sum.digest('hex');
}

/**
 * Base64
 *
 * @param data
 * @return string
 */
function base64(data) {
    var b = new Buffer(data);
    return b.toString('base64');
}

/**
 * Create directory
 *
 * @param directory
 */
function mkdirSyncRecursive(directory) {
    var path = directory.replace(/\/$/, '').split('/');
    for (var i = 1; i <= path.length; i++) {
        var segment = path.slice(0, i).join('/');
        segment.length > 0 && !fs.existsSync(segment) ? fs.mkdirSync(segment) : null;
    }
};

/**
 * Sendpulse API initialization
 *
 * @param user_id
 * @param secret
 * @param storage
 * @param callback
 */
function init(user_id, secret, storage, callback) {
    API_USER_ID = user_id;
    API_SECRET = secret;
    TOKEN_STORAGE = storage;

    if (!callback) {
        callback = function () {
        }
    }

    if (!fs.existsSync(TOKEN_STORAGE)) {
        mkdirSyncRecursive(TOKEN_STORAGE);
    }

    if (TOKEN_STORAGE.substr(-1) !== '/') {
        TOKEN_STORAGE += '/';
    }

    var hashName = md5(API_USER_ID + '::' + API_SECRET);
    if (fs.existsSync(TOKEN_STORAGE + hashName)) {
        TOKEN = fs.readFileSync(TOKEN_STORAGE + hashName, {encoding: 'utf8'});
    }

    if (!TOKEN.length) {
        getToken(callback);
        return;
    }

    callback(TOKEN)
}

/**
 * Form and send request to API service
 *
 * @param path
 * @param method
 * @param data
 * @param useToken
 * @param callback
 *        Define the function  that will be called
 *        when a response is received.
 */
function sendRequest(path, method, data, useToken, callback) {
    var headers = {};
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));

    if (useToken && TOKEN.length) {
        headers['Authorization'] = 'Bearer ' + TOKEN;
    }
    if (method === undefined) {
        method = 'POST';
    }
    if (useToken === undefined) {
        useToken = false;
    }

    var options = {
        //uri: API_URL,
        path: '/' + path,
        port: 443,
        hostname: API_URL,
        method: method,
        headers: headers,
    };

    var req = https.request(
        options,
        function (response) {
            var str = '';
            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                try {
                    var answer = JSON.parse(str);
                } catch (ex) {
                    var answer = returnError(ERRORS.INVALID_RESPONSE);
                }

                if (response.statusCode === 401) {
                    if (answer.error === 'invalid_client') {
                        callback(returnError(ERRORS.INVALID_CREDENTIALS));
                        return;
                    }

                    getToken(function (result) {
                        if (result && result.is_error === 1) {
                            callback(result);
                            return;
                        }

                        sendRequest(path, method, data, true, callback);
                    });
                    return;
                }

                callback(answer);
            });
        }
    );
    req.write(JSON.stringify(data));
    req.on('error', function (error) {
        var answer = returnError(error.code);
        callback(answer);
    });
    req.end();
}

/**
 * Get token and store it
 *
 * @param callback
 */
function getToken(callback) {
    if (!callback) {
        callback = function () {
        }
    }
    var data = {
        grant_type: 'client_credentials',
        client_id: API_USER_ID,
        client_secret: API_SECRET
    };
    sendRequest('oauth/access_token', 'POST', data, false, saveToken);

    function saveToken(data) {
        if (data && data.is_error) {
            callback(data);
            return;
        }

        TOKEN = data.access_token;
        var hashName = md5(API_USER_ID + '::' + API_SECRET);
        fs.writeFileSync(TOKEN_STORAGE + hashName, TOKEN);
        callback(TOKEN)
    }
}

/**
 * Form error object
 *
 *  @return object
 */
function returnError(message) {
    var data = {is_error: 1};
    if (message !== undefined && message.length) {
        data['message'] = message
    }
    return data;
}

/**
 * Serializing of the array
 *
 * @param mixed_value
 * @return string
 */
function serialize(mixed_value) {
    var val, key, okey,
        ktype = '',
        vals = '',
        count = 0,
        _utf8Size = function (str) {
            var size = 0,
                i = 0,
                l = str.length,
                code = '';
            for (i = 0; i < l; i++) {
                code = str.charCodeAt(i);
                if (code < 0x0080) {
                    size += 1;
                } else if (code < 0x0800) {
                    size += 2;
                } else {
                    size += 3;
                }
            }
            return size;
        },
        _getType = function (inp) {
            var match, key, cons, types, type = typeof inp;

            if (type === 'object' && !inp) {
                return 'null';
            }

            if (type === 'object') {
                if (!inp.constructor) {
                    return 'object';
                }
                cons = inp.constructor.toString();
                match = cons.match(/(\w+)\(/);
                if (match) {
                    cons = match[1].toLowerCase();
                }
                types = ['boolean', 'number', 'string', 'array'];
                for (key in types) {
                    if (cons == types[key]) {
                        type = types[key];
                        break;
                    }
                }
            }
            return type;
        },
        type = _getType(mixed_value);

    switch (type) {
        case 'function':
            val = '';
            break;
        case 'boolean':
            val = 'b:' + (mixed_value ? '1' : '0');
            break;
        case 'number':
            val = (Math.round(mixed_value) == mixed_value ? 'i' : 'd') + ':' + mixed_value;
            break;
        case 'string':
            val = 's:' + _utf8Size(mixed_value) + ':"' + mixed_value + '"';
            break;
        case 'array':
        case 'object':
            val = 'a';
            for (key in mixed_value) {
                if (mixed_value.hasOwnProperty(key)) {
                    ktype = _getType(mixed_value[key]);
                    if (ktype === 'function') {
                        continue;
                    }

                    okey = (key.match(/^[0-9]+$/) ? parseInt(key, 10) : key);
                    vals += serialize(okey) + serialize(mixed_value[key]);
                    count++;
                }
            }
            val += ':' + count + ':{' + vals + '}';
            break;
        case 'undefined':
        default:
            val = 'N';
            break;
    }
    if (type !== 'object' && type !== 'array') {
        val += ';';
    }
    return val;
}

/**
 * API interface implementation
 */

/**
 * Get list of address books
 *
 * @param callback
 * @param limit
 * @param offset
 */
function listAddressBooks(callback, limit, offset) {
    var data = {};
    if (limit === undefined) {
        limit = null;
    } else {
        data['limit'] = limit;
    }
    if (offset === undefined) {
        offset = null;
    } else {
        data['offset'] = offset;
    }
    sendRequest('addressbooks', 'GET', data, true, callback);
}

/**
 * Create address book
 *
 * @param callback
 * @param bookName
 */
function createAddressBook(callback, bookName) {
    if ((bookName === undefined) || (!bookName.length)) {
        return callback(returnError('Empty book name'));
    }
    var data = {bookName: bookName};
    sendRequest('addressbooks', 'POST', data, true, callback);
}

/**
 * Edit address book name
 *
 * @param callback
 * @param id
 * @param bookName
 */
function editAddressBook(callback, id, bookName) {
    if ((id === undefined) || (bookName === undefined) || (!bookName.length)) {
        return callback(returnError('Empty book name or book id'));
    }
    var data = {name: bookName};
    sendRequest('addressbooks/' + id, 'PUT', data, true, callback);
}

/**
 * Remove address book
 *
 * @param callback
 * @param id
 */
function removeAddressBook(callback, id) {
    if (id === undefined) {
        return callback(returnError('Empty book id'));
    }
    sendRequest('addressbooks/' + id, 'DELETE', {}, true, callback);
}

/**
 * Get list of email templates
 *
 * @param callback
 */
function listEmailTemplates(callback) {
    sendRequest('templates', 'GET', {}, true, callback);
}

/**
 * Get email template by id
 *
 * @param callback
 * @param id
 */
function getEmailTemplate(callback, id) {
    if (id === undefined) {
        return callback(returnError('Empty email template id'));
    }
    sendRequest('template/' + id, 'GET', {}, true, callback);
}

/**
 * Get information about book
 *
 * @param callback
 * @param id
 */
function getBookInfo(callback, id) {
    if (id === undefined) {
        return callback(returnError('Empty book id'));
    }
    sendRequest('addressbooks/' + id, 'GET', {}, true, callback);
}

/**
 * List email addresses from book
 *
 * @param callback
 * @param id
 */
function getEmailsFromBook(callback, id) {
    if (id === undefined) {
        return callback(returnError('Empty book id'));
    }
    sendRequest('addressbooks/' + id + '/emails', 'GET', {}, true, callback);
}

/**
 * Add new emails to address book
 *
 * @param callback
 * @param id
 * @param emails
 */
function addEmails(callback, id, emails) {
    if ((id === undefined) || (emails === undefined) || (!emails.length)) {
        return callback(returnError('Empty email or book id'));
    }
    var data = {emails: serialize(emails)};
    sendRequest('addressbooks/' + id + '/emails', 'POST', data, true, callback);
}

/**
 * Remove email addresses from book
 *
 * @param callback
 * @param id
 * @param emails
 */
function removeEmails(callback, id, emails) {
    if ((id === undefined) || (emails === undefined) || (!emails.length)) {
        return callback(returnError('Empty email or book id'));
    }
    var data = {emails: serialize(emails)};
    sendRequest('addressbooks/' + id + '/emails', 'DELETE', data, true, callback);
}

/**
 * Get information about email address from book
 *
 * @param callback
 * @param id
 * @param email
 */
function getEmailInfo(callback, id, email) {
    if ((id === undefined) || (email === undefined) || (!email.length)) {
        return callback(returnError('Empty email or book id'));
    }
    sendRequest('addressbooks/' + id + '/emails/' + email, 'GET', {}, true, callback);

}

/**
 * Update Variables for an email address in an address book
 *
 * @param callback
 * @param id
 * @param email
 * @param variables
 */
function updateEmailVariables(callback, id, email, variables) {
    if ((id === undefined) || (email === undefined) || (variables === undefined) || (!variables.length)) {
        return callback(returnError('Empty email, variables or book id'));
    }
    var data = {
        email: email,
        variables: variables
    };
    sendRequest('addressbooks/' + id + '/emails/variable', 'POST', data, true, callback);
}

/**
 * Get cost of campaign based on address book
 *
 * @param callback
 * @param id
 */
function campaignCost(callback, id) {
    if (id === undefined) {
        return callback(returnError('Empty book id'));
    }
    sendRequest('addressbooks/' + id + '/cost', 'GET', {}, true, callback);
}

/**
 * Get list of campaigns
 *
 * @param callback
 * @param limit
 * @param offset
 */
function listCampaigns(callback, limit, offset) {
    var data = {};
    if (limit === undefined) {
        limit = null;
    } else {
        data['limit'] = limit;
    }
    if (offset === undefined) {
        offset = null;
    } else {
        data['offset'] = offset;
    }
    sendRequest('campaigns', 'GET', data, true, callback);
}

/**
 * Get information about campaign
 *
 * @param callback
 * @param id
 */
function getCampaignInfo(callback, id) {
    if (id === undefined) {
        return callback(returnError('Empty book id'));
    }
    sendRequest('campaigns/' + id, 'GET', {}, true, callback);
}

/**
 * Get campaign statistic by countries
 *
 * @param callback
 * @param id
 */
function campaignStatByCountries(callback, id) {
    if (id === undefined) {
        return callback(returnError('Empty book id'));
    }
    sendRequest('campaigns/' + id + '/countries', 'GET', {}, true, callback);
}

/**
 * Get campaign statistic by referrals
 *
 * @param callback
 * @param id
 */
function campaignStatByReferrals(callback, id) {
    if (id === undefined) {
        return callback(returnError('Empty book id'));
    }
    sendRequest('campaigns/' + id + '/referrals', 'GET', {}, true, callback);
}

/**
 * Create new campaign
 *
 * @param callback
 * @param senderName
 * @param senderEmail
 * @param subject
 * @param body
 * @param bookId
 * @param name
 * @param attachments
 */
function createCampaign(callback, senderName, senderEmail, subject, body, bookId, name, attachments) {
    if ((senderName === undefined) || (!senderName.length) || (senderEmail === undefined) || (!senderEmail.length) || (subject === undefined) || (!subject.length) || (body === undefined) || (!body.length) || (bookId === undefined)) {
        return callback(returnError('Not all data.'));
    }
    if (name === undefined) {
        name = '';
    }
    if (attachments === undefined) {
        attachments = '';
    }
    if (attachments.length) {
        attachments = serialize(attachments);
    }
    var data = {
        sender_name: senderName,
        sender_email: senderEmail,
        //subject: encodeURIComponent(subject),
        //subject: urlencode(subject),
        subject: subject,
        body: base64(body),
        list_id: bookId,
        name: name,
        attachments: attachments
    };
    sendRequest('campaigns', 'POST', data, true, callback);
}

/**
 * Cancel campaign
 *
 * @param callback
 * @param id
 */
function cancelCampaign(callback, id) {
    if (id === undefined) {
        return callback(returnError('Empty campaign id'));
    }
    sendRequest('campaigns/' + id, 'DELETE', {}, true, callback);
}

/**
 * List all senders
 *
 * @param callback
 */
function listSenders(callback) {
    sendRequest('senders', 'GET', {}, true, callback);
}

/**
 * Add new sender
 *
 * @param callback
 * @param senderName
 * @param senderEmail
 */
function addSender(callback, senderName, senderEmail) {
    if ((senderEmail === undefined) || (!senderEmail.length) || (senderName === undefined) || (!senderName.length)) {
        return callback(returnError('Empty sender name or email'));
    }
    var data = {
        email: senderEmail,
        name: senderName
    };
    sendRequest('senders', 'POST', data, true, callback);
}

/**
 * Remove sender
 *
 * @param callback
 * @param senderEmail
 */
function removeSender(callback, senderEmail) {
    if ((senderEmail === undefined) || (!senderEmail.length)) {
        return callback(returnError('Empty email'));
    }
    var data = {
        email: senderEmail
    };
    sendRequest('senders', 'DELETE', data, true, callback);
}

/**
 * Activate sender using code
 *
 * @param callback
 * @param senderEmail
 * @param code
 */
function activateSender(callback, senderEmail, code) {
    if ((senderEmail === undefined) || (!senderEmail.length) || (code === undefined) || (!code.length)) {
        return callback(returnError('Empty email or activation code'));
    }
    var data = {
        code: code
    };
    sendRequest('senders/' + senderEmail + '/code', 'POST', data, true, callback);
}

/**
 * Request mail with activation code
 *
 * @param callback
 * @param senderEmail
 */
function getSenderActivationMail(callback, senderEmail) {
    if ((senderEmail === undefined) || (!senderEmail.length)) {
        return callback(returnError('Empty email'));
    }
    sendRequest('senders/' + senderEmail + '/code', 'GET', {}, true, callback);
}

/**
 * Get global information about email
 *
 * @param callback
 * @param email
 */
function getEmailGlobalInfo(callback, email) {
    if ((email === undefined) || (!email.length)) {
        return callback(returnError('Empty email'));
    }
    sendRequest('emails/' + email, 'GET', {}, true, callback);
}

/**
 * Remove email from all books
 *
 * @param callback
 * @param email
 */
function removeEmailFromAllBooks(callback, email) {
    if ((email === undefined) || (!email.length)) {
        return callback(returnError('Empty email'));
    }
    sendRequest('emails/' + email, 'DELETE', {}, true, callback);
}

/**
 * Get email statistic by all campaigns
 *
 * @param callback
 * @param email
 */
function emailStatByCampaigns(callback, email) {
    if ((email === undefined) || (!email.length)) {
        return callback(returnError('Empty email'));
    }
    sendRequest('emails/' + email + '/campaigns', 'GET', {}, true, callback);
}

/**
 * Get all emails from blacklist
 *
 * @param callback
 */
function getBlackList(callback) {
    sendRequest('blacklist', 'GET', {}, true, callback);
}

/**
 * Add email to blacklist
 *
 * @param callback
 * @param emails
 * @param comment
 */
function addToBlackList(callback, emails, comment) {
    if ((emails === undefined) || (!emails.length)) {
        return callback(returnError('Empty email'));
    }
    if (comment === undefined) {
        comment = '';
    }
    var data = {
        emails: base64(emails),
        comment: comment
    };
    sendRequest('blacklist', 'POST', data, true, callback);
}

/**
 * Remove emails from blacklist
 *
 * @param callback
 * @param emails
 */
function removeFromBlackList(callback, emails) {
    if ((emails === undefined) || (!emails.length)) {
        return callback(returnError('Empty emails'));
    }
    var data = {
        emails: base64(emails),
    };
    sendRequest('blacklist', 'DELETE', data, true, callback);
}

/**
 * Get balance
 *
 * @param callback
 * @param currency
 */
function getBalance(callback, currency) {
    if (currency === undefined) {
        var url = 'balance';
    } else {
        var url = 'balance/' + currency.toUpperCase();
    }
    sendRequest(url, 'GET', {}, true, callback);
}

/**
 * SMTP: get list of emails
 *
 * @param callback
 * @param limit
 * @param offset
 * @param fromDate
 * @param toDate
 * @param sender
 * @param recipient
 */
function smtpListEmails(callback, limit, offset, fromDate, toDate, sender, recipient) {
    if (limit === undefined) {
        limit = 0;
    }
    if (offset === undefined) {
        offset = 0;
    }
    if (fromDate === undefined) {
        fromDate = '';
    }
    if (toDate === undefined) {
        toDate = '';
    }
    if (sender === undefined) {
        sender = '';
    }
    if (recipient === undefined) {
        recipient = '';
    }
    var data = {
        limit: limit,
        offset: offset,
        from: fromDate,
        to: toDate,
        sender: sender,
        recipient: recipient
    };
    sendRequest('smtp/emails', 'GET', data, true, callback);
}

/**
 * Get information about email by id
 *
 * @param callback
 * @param id
 */
function smtpGetEmailInfoById(callback, id) {
    if ((id === undefined) || (!id.length)) {
        return callback(returnError('Empty id'));
    }
    sendRequest('smtp/emails/' + id, 'GET', {}, true, callback);
}

/**
 * SMTP: add emails to unsubscribe list
 *
 * @param callback
 * @param emails
 */
function smtpUnsubscribeEmails(callback, emails) {
    if (emails === undefined) {
        return callback(returnError('Empty emails'));
    }
    var data = {
        emails: serialize(emails)
    };
    sendRequest('smtp/unsubscribe', 'POST', data, true, callback);
}

/**
 * SMTP: remove emails from unsubscribe list
 *
 * @param callback
 * @param emails
 */
function smtpRemoveFromUnsubscribe(callback, emails) {
    if (emails === undefined) {
        return callback(returnError('Empty emails'));
    }
    var data = {
        emails: serialize(emails)
    };
    sendRequest('smtp/unsubscribe', 'DELETE', data, true, callback);
}

/**
 * Get list of IP
 *
 * @param callback
 */
function smtpListIP(callback) {
    sendRequest('smtp/ips', 'GET', {}, true, callback);
}

/**
 * SMTP: get list of allowed domains
 *
 * @param callback
 */
function smtpListAllowedDomains(callback) {
    sendRequest('smtp/domains', 'GET', {}, true, callback);
}

/**
 * SMTP: add new domain
 *
 * @param callback
 * @param email
 */
function smtpAddDomain(callback, email) {
    if ((email === undefined) || (!email.length)) {
        return callback(returnError('Empty email'));
    }
    var data = {
        email: email
    };
    sendRequest('smtp/domains', 'POST', data, true, callback);
}

/**
 * SMTP: verify domain
 *
 * @param callback
 * @param email
 */
function smtpVerifyDomain(callback, email) {
    if ((email === undefined) || (!email.length)) {
        return callback(returnError('Empty email'));
    }
    sendRequest('smtp/domains/' + email, 'GET', {}, true, callback);
}

/**
 * SMTP: send mail
 *
 * @param callback
 * @param email
 */
function smtpSendMail(callback, email) {
    if (email === undefined) {
        return callback(returnError('Empty email data'));
    }
    if (email.html)
        email['html'] = base64(email['html']);
    var data = {
        email: serialize(email)
    };
    sendRequest('smtp/emails', 'POST', data, true, callback);
}


// *********************************  SMS  *********************************

/**
 * Add new phones to address book
 *
 * @param callback
 * @param addressbook_id
 * @param phones
 */
function smsAddPhones(callback, addressbook_id, phones) {
    if ((addressbook_id === undefined) || (phones === undefined) || (!phones.length)) {
        return callback(returnError('Empty phones or book id'));
    }
    var data = {
        addressBookId: addressbook_id,
        phones: JSON.stringify(phones)
    };
    sendRequest('sms/numbers', 'POST', data, true, callback);
}

/**
 * Add new phones to address book with variables
 *
 * @param callback
 * @param addressbook_id
 * @param phones
 */
function smsAddPhonesWithVariables(callback, addressbook_id, phones) {
    if ((addressbook_id === undefined) || (phones === undefined) || (!Object.keys(phones).length)) {
        return callback(returnError('Empty phones or book id'));
    }
    var data = {
        addressBookId: addressbook_id,
        phones: JSON.stringify(phones)
    };
    sendRequest('sms/numbers/variables', 'POST', data, true, callback);
}

/**
 * Remove phones from address book
 *
 * @param callback
 * @param addressbook_id
 * @param phones
 */
function smsRemovePhones(callback, addressbook_id, phones) {
    if ((addressbook_id === undefined) || (phones === undefined) || (!phones.length)) {
        return callback(returnError('Empty phones or book id'));
    }
    var data = {
        addressBookId: addressbook_id,
        phones: JSON.stringify(phones)
    };
    sendRequest('sms/numbers', 'DELETE', data, true, callback);
}

/**
 * Get all phones from blacklist
 *
 * @param callback
 */
function smsGetBlackList(callback) {
    sendRequest('sms/black_list', 'GET', {}, true, callback);
}

/**
 * Get information about phone from the address book
 *
 * @param callback
 * @param addressbook_id
 * @param phone
 */
function smsGetPhoneInfo(callback, addressbook_id, phone) {
    if ((addressbook_id === undefined) || (phone === undefined)) {
        return callback(returnError('Empty phone or book id'));
    }

    sendRequest('sms/numbers/info/' + addressbook_id + '/' + phone, 'GET', {}, true, callback);
}

/**
 * Update phones variables from the address book
 *
 * @param callback
 * @param addressbook_id
 * @param phones
 * @param variables
 */
function smsUpdatePhonesVariables(callback, addressbook_id, phones, variables) {
    if (addressbook_id === undefined) {
        return callback(returnError('Empty book id'));
    }
    if ((phones === undefined) || (!phones.length)) {
        return callback(returnError('Empty phones'));
    }
    if ((variables === undefined) || (!Object.keys(variables).length)) {
        return callback(returnError('Empty variables'));
    }
    var data = {
        'addressBookId': addressbook_id,
        'phones': JSON.stringify(phones),
        'variables': JSON.stringify(variables)
    };

    sendRequest('sms/numbers', 'PUT', data, true, callback);
}

/**
 * Get info by phones from the blacklist
 *
 * @param callback
 * @param phones
 */
function smsGetPhonesInfoFromBlacklist(callback, phones) {
    if ((phones === undefined) || (!phones.length)) {
        return callback(returnError('Empty phones'));
    }
    var data = {
        'phones': JSON.stringify(phones),
    };

    sendRequest('sms/black_list/by_numbers', 'GET', data, true, callback);
}

/**
 * Add phones to blacklist
 *
 * @param callback
 * @param phones
 * @param comment
 */
function smsAddPhonesToBlacklist(callback, phones, comment) {
    if ((phones === undefined) || (!phones.length)) {
        return callback(returnError('Empty phones'));
    }
    var data = {
        'phones': JSON.stringify(phones),
        'description': comment
    };

    sendRequest('sms/black_list', 'POST', data, true, callback);
}

/**
 * Remove phones from blacklist
 *
 * @param callback
 * @param phones
 */
function smsDeletePhonesFromBlacklist(callback, phones) {
    if ((phones === undefined) || (!phones.length)) {
        return callback(returnError('Empty phones'));
    }
    var data = {
        'phones': JSON.stringify(phones),
    };

    sendRequest('sms/black_list', 'DELETE', data, true, callback);
}

/**
 * Create new sms campaign
 *
 * @param callback
 * @param sender_name
 * @param addressbook_id
 * @param body
 * @param date
 * @param transliterate
 */
function smsAddCampaign(callback, sender_name, addressbook_id, body, date, transliterate) {
    if (sender_name === undefined) {
        return callback(returnError('Empty sender name'));
    }
    if (addressbook_id === undefined) {
        return callback(returnError('Empty book id'));
    }
    if (body === undefined) {
        return callback(returnError('Empty sms text'));
    }
    var data = {
        'sender': sender_name,
        'addressBookId': addressbook_id,
        'body': body,
        'date': date,
        'transliterate': transliterate
    };

    sendRequest('sms/campaigns', 'POST', data, true, callback);
}

/**
 * Send sms by some phones
 *
 * @param callback
 * @param sender_name
 * @param phones
 * @param body
 * @param date
 * @param transliterate
 * @param route
 */
function smsSend(callback, sender_name, phones, body, date, transliterate, route) {
    if (sender_name === undefined) {
        return callback(returnError('Empty sender name'));
    }
    if ((phones === undefined) || (!phones.length)) {
        return callback(returnError('Empty phones'));
    }
    if (body === undefined) {
        return callback(returnError('Empty sms text'));
    }
    var data = {
        'sender': sender_name,
        'phones': JSON.stringify(phones),
        'body': body,
        'date': date,
        'transliterate': transliterate,
        'route': route
    };

    sendRequest('sms/send', 'POST', data, true, callback);
}

/**
 * Get list of campaigns
 *
 * @param callback
 * @param date_from
 * @param date_to
 */
function smsGetListCampaigns(callback, date_from, date_to) {
    var data = {
        'dateFrom': date_from,
        'dateTo': date_to
    };

    sendRequest('sms/campaigns/list', 'GET', data, true, callback);
}

/**
 * Get information about sms campaign
 *
 * @param callback
 * @param campaign_id
 */
function smsGetCampaignInfo(callback, campaign_id) {
    if (campaign_id === undefined) {
        return callback(returnError('Empty sms campaign id'));
    }

    sendRequest('sms/campaigns/info/' + campaign_id, 'GET', {}, true, callback);
}

/**
 * Cancel sms campaign
 *
 * @param callback
 * @param campaign_id
 */
function smsCancelCampaign(callback, campaign_id) {
    if (campaign_id === undefined) {
        return callback(returnError('Empty sms campaign id'));
    }

    sendRequest('sms/campaigns/cancel/' + campaign_id, 'PUT', {}, true, callback);
}

/**
 * Get cost sms campaign
 *
 * @param callback
 * @param sender
 * @param body
 * @param addressbook_id
 * @param phones
 */
function smsGetCampaignCost(callback, sender_name, body, addressbook_id, phones) {
    if (sender_name === undefined) {
        return callback(returnError('Empty sender name'));
    }
    if (body === undefined) {
        return callback(returnError('Empty sms text'));
    }
    if ((addressbook_id === undefined) || (phones === undefined) || (!phones.length)) {
        return callback(returnError('Empty book id or phones'));
    }
    var data = {
        'sender': sender_name,
        'body': body,
        'addressBookId': addressbook_id
    };
    if (phones.length) {
        data['phones'] = JSON.stringify(phones);
    }

    sendRequest('sms/campaigns/cost', 'GET', data, true, callback);
}

/**
 * Remove sms campaign
 *
 * @param callback
 * @param campaign_id
 */
function smsDeleteCampaign(callback, campaign_id) {
    if (campaign_id === undefined) {
        return callback(returnError('Empty sms campaign id'));
    }
    var data = {
        'id': campaign_id
    };
    sendRequest('sms/campaigns', 'DELETE', data, true, callback);
}

exports.init = init;
exports.listAddressBooks = listAddressBooks;
exports.createAddressBook = createAddressBook;
exports.editAddressBook = editAddressBook;
exports.removeAddressBook = removeAddressBook;
exports.listEmailTemplates = listEmailTemplates;
exports.getEmailTemplate = getEmailTemplate;
exports.getBookInfo = getBookInfo;
exports.getEmailsFromBook = getEmailsFromBook;
exports.addEmails = addEmails;
exports.removeEmails = removeEmails;
exports.getEmailInfo = getEmailInfo;
exports.updateEmailVariables = updateEmailVariables;
exports.campaignCost = campaignCost;
exports.listCampaigns = listCampaigns;
exports.getCampaignInfo = getCampaignInfo;
exports.campaignStatByCountries = campaignStatByCountries;
exports.campaignStatByReferrals = campaignStatByReferrals;
exports.createCampaign = createCampaign;
exports.cancelCampaign = cancelCampaign;
exports.listSenders = listSenders;
exports.addSender = addSender;
exports.removeSender = removeSender;
exports.activateSender = activateSender;
exports.getSenderActivationMail = getSenderActivationMail;
exports.getEmailGlobalInfo = getEmailGlobalInfo;
exports.removeEmailFromAllBooks = removeEmailFromAllBooks;
exports.emailStatByCampaigns = emailStatByCampaigns;
exports.getBlackList = getBlackList;
exports.addToBlackList = addToBlackList;
exports.removeFromBlackList = removeFromBlackList;
exports.getBalance = getBalance;
exports.smtpListEmails = smtpListEmails;
exports.smtpGetEmailInfoById = smtpGetEmailInfoById;
exports.smtpUnsubscribeEmails = smtpUnsubscribeEmails;
exports.smtpRemoveFromUnsubscribe = smtpRemoveFromUnsubscribe;
exports.smtpListIP = smtpListIP;
exports.smtpListAllowedDomains = smtpListAllowedDomains;
exports.smtpAddDomain = smtpAddDomain;
exports.smtpVerifyDomain = smtpVerifyDomain;
exports.smtpSendMail = smtpSendMail;
exports.smsGetBlackList = smsGetBlackList;
exports.smsAddPhones = smsAddPhones;
exports.smsAddPhonesWithVariables = smsAddPhonesWithVariables;
exports.smsRemovePhones = smsRemovePhones;
exports.smsGetPhoneInfo = smsGetPhoneInfo;
exports.smsUpdatePhonesVariables = smsUpdatePhonesVariables;
exports.smsGetPhonesInfoFromBlacklist = smsGetPhonesInfoFromBlacklist;
exports.smsAddPhonesToBlacklist = smsAddPhonesToBlacklist;
exports.smsDeletePhonesFromBlacklist = smsDeletePhonesFromBlacklist;
exports.smsAddCampaign = smsAddCampaign;
exports.smsSend = smsSend;
exports.smsGetListCampaigns = smsGetListCampaigns;
exports.smsGetCampaignInfo = smsGetCampaignInfo;
exports.smsCancelCampaign = smsCancelCampaign;
exports.smsGetCampaignCost = smsGetCampaignCost;
exports.smsDeleteCampaign = smsDeleteCampaign;
exports.getToken = getToken;
