export interface ReturnError {
    is_error: 1;
    message?: string;
    error_code?: number;
}

export interface CampaignCost {
    cur: string;
    sent_emails_qty: number;
    overdraftAllEmailsPrice: number;
    addressesDeltaFromBalance: number;
    addressesDeltaFromTariff: number;
    max_emails_per_task: number;
    result: boolean;
}

export interface CreateCampaign {
    id: number;
    status: number;
    count: number;
    tariff_email_qty: number;
    overdraft_price: string;
    ovedraft_currency: string;
}

export interface EmailStatByCampaigns {
    statistic: {
        sent: number;
        open: number;
        link: number;
    };
    blacklist: boolean;
    addressbooks: {
        id: number;
        address_book_name: string;
    }[];
}

export interface BookInfo {
    id: number;
    name: string;
    all_email_qty: number;
    active_email_qty: number;
    inactive_email_qty: number;
    creationdate: string;
    status: number;
    status_explain: string;
}

export interface EmailFromBook {
    email: string;
    status: number;
    status_explain: string;
    variables: Record<string, string>;
}

export interface EmailGlobalInfo extends EmailFromBook {
    book_id: number;
}

export interface EmailInfo extends EmailFromBook {
    abook_id: string;
    phone: string;
}

interface Contact {
    name: string;
    email: string;
}

export interface EmailPayload {
    html: string;
    text: string;
    template?: {
        id: string | number;
        variables: Record<string, string>;
    };
    auto_plain_text?: boolean;
    subject: string;
    from: Contact;
    to: Contact[];
    bcc?: Contact[];
    attachments?: Record<string, string>;
    attachments_binary?: Record<string, string>;
}

type sendRequestCallback<T> = (result: ReturnError | T) => any;

export function activateSender(callback: sendRequestCallback<{ result: boolean, email: string }>, senderEmail: string, code: string): any;

export function addEmails(callback: sendRequestCallback<{ result: boolean }>, id: number, emails: { email: string; variables: Record<string, string>; }[]): any;

export function addSender(callback: sendRequestCallback<{ result: boolean }>, senderName: string, senderEmail: string): any;

export function addToBlackList(callback: sendRequestCallback<{ result: boolean }>, emails: string, comment?: string): any;

export function campaignCost(callback: sendRequestCallback<CampaignCost>, id: number): any;

export function campaignStatByCountries(callback: sendRequestCallback<Record<string, number>>, id: number): any;

export function campaignStatByReferrals(callback: sendRequestCallback<{ link: string; count: number; }[]>, id: number): any;

export function cancelCampaign(callback: sendRequestCallback<{ result: boolean }>, id: number): any;

export function createAddressBook(callback: sendRequestCallback<{ id: number }>, bookName: string): any;

export function createCampaign(callback: sendRequestCallback<CreateCampaign>, senderName: string, senderEmail: string, subject: string, body: string, bookId: number | number[], name?: string, attachments?: Record<string, string>): any;

export function editAddressBook(callback: sendRequestCallback<{ result: boolean }>, id: number, bookName: string): any;

export function emailStatByCampaigns(callback: sendRequestCallback<EmailStatByCampaigns>, email: string): any;

export function getBalance(callback: any, currency?: string): void;

export function getBlackList(callback: sendRequestCallback<string[]>): void;

export function getBookInfo(callback: sendRequestCallback<BookInfo[]>, id: number): any;

export function getCampaignInfo(callback: any, id: number): any;

export function getEmailGlobalInfo(callback: sendRequestCallback<EmailGlobalInfo>, email: string): any;

export function getEmailInfo(callback: sendRequestCallback<EmailInfo>, id: number, email: string): any;

export function getEmailTemplate(callback: any, id: number | string): any;

export function getEmailsFromBook(callback: sendRequestCallback<EmailFromBook[]>, id: number): any;

export function getSenderActivationMail(callback: sendRequestCallback<{ result: boolean, email: string }>, senderEmail: string): any;

export function getToken(callback?: any): void;

export function init(user_id: string, secret: string, storage: string, callback?: any): void;

export function listAddressBooks(callback: sendRequestCallback<BookInfo[]>, limit?: number, offset?: number): void;

export function listCampaigns(callback: any, limit?: number, offset?: number): void;

export function listEmailTemplates(callback: any): void;

export function listSenders(callback: any): void;

export function removeAddressBook(callback: sendRequestCallback<{ result: boolean }>, id: number): any;

export function removeEmailFromAllBooks(callback: sendRequestCallback<{ result: boolean }>, email: string): any;

export function removeEmails(callback: sendRequestCallback<{ result: boolean }>, id: number, emails: string[]): any;

export function removeFromBlackList(callback: any, emails: string): any;

export function removeSender(callback: any, senderEmail: any): any;

export function smsAddCampaign(callback: any, sender_name: any, addressbook_id: any, body: any, date: any, transliterate: any): any;

export function smsAddPhones(callback: any, addressbook_id: any, phones: any): any;

export function smsAddPhonesToBlacklist(callback: any, phones: any, comment: any): any;

export function smsAddPhonesWithVariables(callback: any, addressbook_id: any, phones: any): any;

export function smsCancelCampaign(callback: any, campaign_id: any): any;

export function smsDeleteCampaign(callback: any, campaign_id: any): any;

export function smsDeletePhonesFromBlacklist(callback: any, phones: any): any;

export function smsGetBlackList(callback: any): void;

export function smsGetCampaignCost(callback: any, sender_name: any, body: any, addressbook_id: any, phones: any): any;

export function smsGetCampaignInfo(callback: any, campaign_id: any): any;

export function smsGetListCampaigns(callback: any, date_from: any, date_to: any): void;

export function smsGetPhoneInfo(callback: any, addressbook_id: any, phone: any): any;

export function smsGetPhonesInfoFromBlacklist(callback: any, phones: any): any;

export function smsRemovePhones(callback: any, addressbook_id: any, phones: any): any;

export function smsSend(callback: any, sender_name: any, phones: any, body: any, date: any, transliterate: any, route: any): any;

export function smsUpdatePhonesVariables(callback: any, addressbook_id: any, phones: any, variables: any): any;

export function smtpAddDomain(callback: any, email: string): any;

export function smtpGetEmailInfoById(callback: any, id: string): any;

export function smtpListAllowedDomains(callback: any): void;

export function smtpListEmails(callback: any, limit: number, offset: number, fromDate: any, toDate: any, sender: any, recipient: string): void;

export function smtpListIP(callback: any): void;

export function smtpRemoveFromUnsubscribe(callback: any, emails: string[]): any;

export function smtpSendMail(callback: sendRequestCallback<{ result: boolean; id: string; }>, email: EmailPayload): any;

export function smtpUnsubscribeEmails(callback: any, emails: { email: string; comment?: string; }[]): any;

export function smtpVerifyDomain(callback: any, email: string): any;

export function updateEmailVariables(callback: any, id: number, email: string, variables: Record<string, string>): any;

