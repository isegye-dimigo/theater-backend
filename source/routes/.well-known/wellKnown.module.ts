import Module from '@library/module';
import getSecurityTxtController from './getSecurityTxt.controller';

export default new Module([{
	method: 'GET',
	path: 'security.txt',
	handlers: [getSecurityTxtController]
}], '.well-known');