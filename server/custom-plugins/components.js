'use strict';

const FS = require("../../dist/lib/fs").FS;
let https = require('https');
const Autolinker = require('autolinker');

let regdateCache = {};

exports.Server = {
	nameColor: function (name, bold, userGroup) {
		let userGroupSymbol = `${Users.globalAuth.get(toID(name)) ? `<strong><font color=#948A88>${Users.globalAuth.get(toID(name)).substr(0, 1)}</font></strong>` : ``}`;
	  return `${(userGroup ? userGroupSymbol : ``)}${(bold ? `<strong>` : ``)}<font color=${Server.hashColor(name)}>${(Users.get(name) && Users.get(name).connected && Users.getExact(name) ? Chat.escapeHTML(Users.getExact(name).name) : Chat.escapeHTML(name))}</font>${(bold ? `</strong>` : ``)}`;
 },
	// usage: Server.nameColor(user.name, true) for bold OR Server.nameColor(user.name, false) for non-bolded.

	messageSeniorStaff: function (message, pmName, from) {
		pmName = (pmName ? pmName : `${Config.serverName} Server`);
		from = (from ? ' (PM from ' + from + ')' : '');
		Users.users.forEach(curUser => {
			if (curUser.can('roomowner')) {
				curUser.send('|pm|' + pmName + '|' + curUser.getIdentity() + '|' + message + from);
			}
		});
	},
	
    pmStaff: function (message, pmName, from) {
	pmName = (pmName ? pmName : `~${Config.serverName} Server`);
	from = (from ? ` (PM from ${from})` : ``);
	Users.users.forEach(curUser => {
		if (!curUser.isStaff) return;
		curUser.send(`|pm|${pmName}|${curUser.getIdentity()}|${message}`);
	});
	},
	// format: Server.pmStaff("message", "person")
   // usage: Server.pmStaff("Hey, Staff Meeting time", "~Server")
   // this makes a PM from ~Server stating the message.
   
  pmAll: function (message, pmName) {
	pmName = (pmName ? pmName : `~${Config.serverName} Server`);
	Users.users.forEach(curUser => {
		curUser.send(`|pm|${pmName}|${curUser.getIdentity()}|${message}`);
	});
},
    // format: Server.pmAll("message", "person")
    // usage: Server.pmAll("Event in Lobby in 5 minutes!", "~Server")
   // this makes a PM from ~Server stating the message.
   
 regdate: function (target, callback) {
		target = toID(target);
		if (regdateCache[target]) return callback(regdateCache[target]);
		let req = https.get('https://pokemonshowdown.com/users/' + target + '.json', res => {
			let data = '';
			res.on('data', chunk => {
				data += chunk;
			}).on('end', () => {
				try {
					data = JSON.parse(data);
				} catch (e) {
					return callback(false);
				}
				let date = data['registertime'];
				if (date !== 0 && date.toString().length < 13) {
					while (date.toString().length < 13) {
						date = Number(date.toString() + '0');
					}
				}
				if (date !== 0) {
					regdateCache[target] = date;
					saveRegdateCache();
				}
				callback((date === 0 ? false : date));
			});
		});
		req.end();
	},
	
	randomString: function (length) {
		return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
	},
	
	reloadCSS: function () {
		const cssPath = 'lounge '; // This should be the serverid if Config.serverid doesn't exist. Ex: 'serverid'
		let req = https.get('https://play.pokemonshowdown.com/customcss.php?server=' + (Config.serverid || cssPath), () => {});
		req.end();
	},
	
	/* eslint-disable no-useless-escape */
	parseMessage: function (message) {
		if (message.substr(0, 5) === "/html") {
			message = message.substr(5);
			message = message.replace(/\_\_([^< ](?:[^<]*?[^< ])?)\_\_(?![^<]*?<\/a)/g, '<i>$1</i>'); // italics
			message = message.replace(/\*\*([^< ](?:[^<]*?[^< ])?)\*\*/g, '<b>$1</b>'); // bold
			message = message.replace(/\~\~([^< ](?:[^<]*?[^< ])?)\~\~/g, '<strike>$1</strike>'); // strikethrough
			message = message.replace(/&lt;&lt;([a-z0-9-]+)&gt;&gt;/g, '&laquo;<a href="/$1" target="_blank">$1</a>&raquo;'); // <<roomid>>
			message = Autolinker.link(message.replace(/&#x2f;/g, '/'), {stripPrefix: false, phone: false, twitter: false});
			return message;
		}
		message = Chat.escapeHTML(message).replace(/&#x2f;/g, '/');
		message = message.replace(/\_\_([^< ](?:[^<]*?[^< ])?)\_\_(?![^<]*?<\/a)/g, '<i>$1</i>'); // italics
		message = message.replace(/\*\*([^< ](?:[^<]*?[^< ])?)\*\*/g, '<b>$1</b>'); // bold
		message = message.replace(/\~\~([^< ](?:[^<]*?[^< ])?)\~\~/g, '<strike>$1</strike>'); // strikethrough
		message = message.replace(/&lt;&lt;([a-z0-9-]+)&gt;&gt;/g, '&laquo;<a href="/$1" target="_blank">$1</a>&raquo;'); // <<roomid>>
		message = Autolinker.link(message, {stripPrefix: false, phone: false, twitter: false});
		return message;
	},
};
function loadRegdateCache() {
	try {
		regdateCache = JSON.parse(FS('config/regdate.json').readIfExistsSync());
	} catch (e) {}
}
loadRegdateCache();

function saveRegdateCache() {
	FS('config/regdate.json').writeSync(JSON.stringify(regdateCache));
}
