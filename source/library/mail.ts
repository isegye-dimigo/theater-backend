// @ts-expect-error :: No type definition
import { SMTPChannel } from 'smtp-channel';

const smtp: SMTPChannel = new SMTPChannel({
	host: process['env']['EMAIL_HOST'],
	port: Number.parseInt(process['env']['EMAIL_PORT']),
	secure: true
});

export default function sendMail(email: string, title: string, content: string): Promise<void> {
	return smtp.connect()
	.then(function (): Promise<void> {
		return smtp.write('EHLO server\r\n');
	})
	.then(function (): Promise<void> {
		return smtp.write('AUTH LOGIN\r\n');
	})
	.then(function (): Promise<void> {
		return smtp.write(Buffer.from(process['env']['EMAIL_USER'], 'utf-8').toString('base64') + '\r\n' + Buffer.from(process['env']['EMAIL_PASSWORD'], 'utf-8').toString('base64') + '\r\nMAIL FROM:<' + process['env']['EMAIL_USER'] + '> SMTPUTF8\r\nRCPT TO:<' + email + '>\r\n');
	})
	.then(function (): Promise<void> {
		return smtp.write('DATA\r\n');
	})
	.then(function (): Promise<void> {
		return smtp.write('From: =?UTF-8?B?7J207IS46rOE?= <' + process['env']['EMAIL_USER'] + '>\r\nTo: <' + email + '>\r\nSubject: =?UTF-8?B?' + Buffer.from(title.replace(/\./m, '..'), 'utf-8').toString('base64') + '?=\r\nContent-Type: text/html; charset="UTF-8";\r\n\r\n' + content.replace(/[^\r]\n/g, '\r\n').replace(/^\./m, '..') + '\r\n.\r\nQUIT\r\n');
	})
	.then(function (): Promise<void> {
		return smtp.close();
	});
}