// @ts-expect-error :: No type definition
import { SMTPChannel } from 'smtp-channel';

const smtp: SMTPChannel = new SMTPChannel({
	host: process['env']['EMAIL_HOST'],
	port: Number(process['env']['EMAIL_PORT']),
	// SSL/TLS instead of STARTTLS
	secure: true
});

export function sendMail(email: string, title: string, content: string): Promise<boolean> {
	return smtp.connect()
	.then(function (): Promise<void> {
		return smtp.write('EHLO server\r\n');
	})
	// SSL/TLS instead of STARTTLS
	//.then(function (): Promise<void> {
	//	return smtp.write('STARTTLS\r\n');
	//})
	//.then(function (): Promise<void> {
	//	return smtp.negotiateTLS();
	//})
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
		return smtp.write('From: =?UTF-8?B?7J207IS46rOE?= <' + process['env']['EMAIL_USER'] + '>\r\nTo: <' + email + '>\r\nSubject: =?UTF-8?B?' + Buffer.from(title.replace(/\./m, '..'), 'utf-8').toString('base64') + '?=\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n' + Buffer.from(content.replace(/[^\r]\n/g, '\r\n').replace(/^\./m, '..')).toString('base64') + '\r\n.\r\nQUIT\r\n');
	})
	.then(function (): Promise<void> {
		return smtp.close();
	});
}

export function getVerificationContent(name: string, token: string): string {
	return '<body style="margin:100px auto;width:540px;border-top:4px solid #5d63bd;padding:0 4px"><header style="margin:32px 0"><h1 style="margin:0;font-size:28px;color:#141c2f">이세계</h1><h2 style="margin:0;font-size:16px;font-weight:400;padding:0 2px">메일 인증 안내</h2></header><main style="margin:64px 0;font-size:16px"><p style="line-height:30px"><b>' + name + '</b>님, 이세계에 오신 것을 환영합니다.<br>아래 버튼을 눌러 회원가입을 완료해주세요.</p><a href="https://api.isegye.kr/auth/email?token=' + token + '" style="margin:48px 0;display:block;width:210px;height:48px;text-align:center;line-height:48px;text-decoration:none;color:#fff;background:#5d63bd">메일 인증</a></main><footer style="margin:64px 0;border-top:1px solid #ddd;color:#555;font-size:12px;padding:16px 2px 0"><p style="margin:0">만약 버튼이 정상적으로 클릭되지 않는다면, 아래 링크로 접속해 주세요.</p><a href="https://api.isegye.kr/auth/email?token=' + token + '">https://api.isegye.kr/auth/email?token=' + token + '</a></footer></body>';
}