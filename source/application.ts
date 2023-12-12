import '@library/environment';
import '@library/schedule';
import Module from '@library/module';
import Server from '@library/server';
import rootModule from './routes/root.module';
import JsonWebToken from '@library/jsonWebToken';

const server: Server = new Server({
	isProxied: true
});

rootModule.register(server);

server['logger'].info('Routes:\n' + Module.getRouteTree(server));

server.listen(3000)
.then(function (): void {
	server['logger'].info('http://127.0.0.1:3000');

	server['logger'].debug(JsonWebToken.create({
		uid: 0,
		hdl: '#',
		vrf: true
	}, process['env']['JSON_WEB_TOKEN_SECRET']));

	return;
})
.catch(server['logger'].fatal);