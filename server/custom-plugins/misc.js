"use strict";

const https = require("https");
const http = require("http");

let pmName = `~${Config.serverName} Server`;

let udCache = {};
let defCache = {};

let messages = [
	`has vanished into nothingness!`,
	`used Explosion!`,
	`fell into the void.`,
	`went into a cave without a repel!`,
	`has left the building.`,
	`was forced to give StevoDuhHero's mom an oil massage!`,
	`was hit by Magikarp's Revenge!`,
	`ate a bomb!`,
	`is blasting off again!`,
	`(Quit: oh god how did this get here i am not good with computer)`,
	`was unfortunate and didn't get a cool message.`,
	`{{user}}'s mama accidently kicked {{user}} from the server!`,
	`felt Insist's wrath.`,
	`got rekt by Travis CI!`,
	`exited life.exe.`,
	`found a species called "friends" (whatever that means).`,
];


function clearRoom(room) {
	let len = (room.log.log && room.log.log.length) || 0;
	let users = [];
	while (len--) {
		room.log.log[len] = "";
	}
	for (let u in room.users) {
		users.push(u);
		Users.get(u).leaveRoom(room, Users.get(u).connections[0]);
	}
	len = users.length;
	setTimeout(() => {
		while (len--) {
			Users.get(users[len]).joinRoom(room, Users.get(users[len]).connections[0]);
		}
	}, 1000);
}

exports.commands = {
clearall(target, room, user) {
		room = this.requireRoom();
		this.checkCan('ban', null, room);
		if (room.battle) return this.errorReply("You cannot clearall in battle rooms.");

		clearRoom(room);

		this.privateModAction(`(${user.name} used /clearall.)`);
	},
  gclearall: "globalclearall",
	globalclearall(target, room, user) {
		room = this.requireRoom();
		this.checkCan('hotpatch', null, room);

		Rooms.rooms.forEach(r => clearRoom(room));
		Users.users.forEach(u => user.popup("All rooms have been cleared."));
		this.privateModAction(`(${user.name} used /globalclearall.)`);
	},
  rk: "kick",
	roomkick: "kick",
	kick(target, room, user) {
		if (!target) return this.parse("/help kick");
		target = this.splitTarget(target);
		const targetUser = this.targetUser;
		if (target.length > 300) return this.errorReply("The reason is too long. It cannot exceed 300 characters.");
		if (!targetUser || !targetUser.connected) return this.errorReply(`User "${this.targetUsername}" not found.`);
		room = this.requireRoom();
		this.checkCan('mute', null, room);
		if (!room.users[targetUser.id]) return this.errorReply(`User "${this.targetUsername}" is not in this room.`);

		this.addModAction(`${targetUser.name} was kicked from the room by ${user.name}. (${target})`);
		targetUser.popup(`You were kicked from ${room.roomid} by ${user.name}. ${(target ? `(${target})` : ``)}`);
		targetUser.leaveRoom(room.roomid);
	},
	kickhelp: ["/kick [user], [reason] - Kick a user out of a room [reasons are optional]. Requires: % @ # & ~"],
  
  roomlist(target, room, user) {
		let header = [`<strong><font color="#1aff1a" size="2">Total users connected: ${Rooms.rooms.userCount}</font></strong><br />`],
			official = [`<strong><font color="#ff9900" size="2"><u>Official Rooms:</u></font></strong><br />`],
			nonOfficial = [`<hr><strong><u><font color="#005ce6" size="2">Public Rooms:</font></u></strong><br />`],
			privateRoom = [`<hr><strong><u><font color="#ff0066" size="2">Private Rooms:</font></u></strong><br />`],
			groupChats = [`<hr><strong><u><font color="#00b386" size="2">Group Chats:</font></u></strong><br />`],
			battleRooms = [`<hr><strong><u><font color="#cc0000" size="2">Battle Rooms:</font></u></strong><br />`];

		let rooms = [];

		Rooms.rooms.forEach(curRoom => {
			if (curRoom.roomid !== "global") rooms.push(curRoom.roomid);
		});

		rooms.sort();

		for (let u in rooms) {
			let curRoom = Rooms.get(rooms[u]);
			if (curRoom.type === "battle") {
				battleRooms.push(`<a href="/${curRoom.roomid}" class="ilink">${curRoom.title}</a> (${curRoom.userCount})`);
			}
			if (curRoom.type === "chat") {
				if (curRoom.isPersonal) {
					groupChats.push(`<a href="/${curRoom.roomid}" class="ilink">${curRoom.id}</a> (${curRoom.userCount})`);
					continue;
				}
				if (curRoom.settings.isOfficial) {
					official.push(`<a href="/${toID(curRoom.title)}" class="ilink">${curRoom.title}</a> (${curRoom.userCount})`);
					continue;
				}
				if (curRoom.settings.isPrivate) {
					privateRoom.push(`<a href="/${toID(curRoom.title)}" class="ilink">${curRoom.title}</a> (${curRoom.userCount})`);
					continue;
				}
			}
			if (curRoom.type !== "battle") nonOfficial.push(`<a href="/${toID(curRoom.title)}" class="ilink">${curRoom.title}</a> (${curRoom.userCount})`);
		}

		if (!user.can("roomowner")) return this.sendReplyBox(header + official.join(" ") + nonOfficial.join(" "));
		this.sendReplyBox(header + official.join(" ") + nonOfficial.join(" ") + privateRoom.join(" ") + (groupChats.length > 1 ? groupChats.join(" ") : "") + (battleRooms.length > 1 ? battleRooms.join(" ") : ""));
	}, 
  "!regdate": true,
	regdate(target, room, user) {
		if (!target) target = user.name;
		target = toID(target);
		if (target.length < 1 || target.length > 19) {
			return this.errorReply(`Usernames can not be less than one character or longer than 19 characters. (Current length: ${target.length}.)`);
		}
		if (!this.runBroadcast()) return;
		Server.regdate(target, date => {
			if (date) {
				this.sendReplyBox(regdateReply(date));
			}
		});

		function regdateReply(date) {
			if (date === 0) {
				return `${Server.nameColor(target, true)} <strong><font color="red">is not registered.</font></strong>`;
			} else {
				let d = new Date(date);
				let MonthNames = ["January", "February", "March", "April", "May", "June",
					"July", "August", "September", "October", "November", "December",
				];
				let DayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
				return `${Server.nameColor(target, true)} was registered on <strong>${DayNames[d.getUTCDay()]}, ${MonthNames[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}</strong> at <strong>${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()} UTC.</strong>`;
			}
			//room.update();
		}
	},
	regdatehelp: ["/regdate - Gets the regdate (register date) of a username."],
  
  "!seen": true,
	seen(target, room, user) {
		if (!this.runBroadcast()) return;
		if (!target) return this.parse("/help seen");
		let targetUser = Users.get(target);
		if (targetUser && targetUser.connected) return this.sendReplyBox(`${Server.nameColor(targetUser.name, true)} is <strong><font color="limegreen">Currently Online</strong></font>.`);
		target = Chat.escapeHTML(target);
		let seen = Db.seen.get(toID(target));
		if (!seen) return this.sendReplyBox(`${Server.nameColor(target, true)} has <strong><font color="red">never been online</font></strong> on this server.`);
		this.sendReplyBox(`${Server.nameColor(target, true)} was last seen <strong>${Chat.toDurationString(Date.now() - seen, {precision: true})}</strong> ago.`);
	},
	seenhelp: ["/seen - Shows when the user last connected on the server."],
  
  "!m8b": true,
	helixfossil: "m8b",
	helix: "m8b",
	magic8ball: "m8b",
	m8b(target, room, user) {
		if (!this.runBroadcast()) return;
		let results = ["Signs point to yes.", "Yes.", "Reply hazy, try again.", "Without a doubt.", "My sources say no.", "As I see it, yes.", "You may rely on it.", "Concentrate and ask again.", "Outlook not so good.", "It is decidedly so.", "Better not tell you now.", "Very doubtful.", "Yes - definitely.", "It is certain.", "Cannot predict now.", "Most likely.", "Ask again later.", "My reply is no.", "Outlook good.", "Don't count on it."];
		return this.sendReplyBox(results[Math.floor(Math.random() * results.length)]);
	},
  
	declaregreen: "declarered",
	declarered(target, room, user, connection, cmd) {
		if (!target) return this.parse("/help declare");
		room = this.requireRoom();
		this.checkCan('declare', null, room);
		if (!this.canTalk() && !user.can("bypassall")) return this.errorReply("You cannot do this while unable to talk.");
		room.addRaw(`<div class="broadcast-${cmd.substr(7)}"><strong>${target}</strong></div>`);
		room.update();
		this.room.modlog(`${user.name} declared ${target}`);
	},
  fj: "forcejoin",
	forcejoin(target, room, user) {
		room = this.requireRoom();
		this.checkCan('lock', null, room);
		if (!target) return this.parse("/help forcejoin");
		let parts = target.split(",");
		if (!parts[0] || !parts[1]) return this.parse("/help forcejoin");
		let userid = toID(parts[0]);
		let roomid = toID(parts[1]);
		if (!Users.get(userid)) return this.errorReply("User not found.");
		if (!Rooms.get(roomid)) return this.errorReply("Room not found.");
		Users.get(userid).joinRoom(roomid);
	},
	forcejoinhelp: ["/forcejoin [target], [room] - Forces a user to join a room"],
  
  kickall(target, room, user) {
		room = this.requireRoom();
		this.checkCan('profile', null, room);
		for (let i in room.users) {
			if (room.users[i] !== user.id) {
				room.users[i].leaveRoom(room.roomid);
			}
		}
		this.privateModAction(`(${user.name} kicked everyone from the room.)`);
	},
  masspm: "pmall",
	pmall(target, room, user) {
		room = this.requireRoom();
		this.checkCan('hotpatch', null, room);
		if (!target) return this.parse("/help pmall");
		Server.pmAll(target, pmName, user.name);
		Monitor.adminlog(`${user.name} has PM'ed all users: ${target}.`);
	},
	pmallhelp: ["/pmall [message] - PM all users in the server."],

	staffpm: "pmallstaff",
	pmstaff: "pmallstaff",
	pmallstaff(target, room, user) {
		room = this.requireRoom();
		this.checkCan('hotpatch', null, room);
		if (!target) return this.parse("/help pmallstaff");
		Server.pmStaff(target, pmName, user.name);
		Monitor.adminlog(`${user.name} has PM'ed all Staff: ${target}.`);
	},
	pmallstaffhelp: ["/pmallstaff [message] - Sends a PM to every staff member online."],

	pus: "pmupperstaff",
	pmupperstaff(target, room, user) {
		if (!target) return this.errorReply("/pmupperstaff [message] - Sends a PM to every upper staff");
		room = this.requireRoom();
		this.checkCan('hotpatch', null, room);
		if (!target) return this.parse("/help pmupperstaff");
		Server.messageSeniorStaff(target, pmName, user.name);
		Monitor.adminlog(`${user.name} has PM'ed all Upper Staff: ${target}.`);
	},
	pmupperstaffhelp: ["/pmupperstaff [message] - Sends a PM to every Upper Staff member online."],

	pmroom: "rmall",
	roompm: "rmall",
	rmall(target, room, user) {
		room = this.requireRoom();
		this.checkCan('declare', null, room);
		if (!target) return this.errorReply("/rmall [message] - Sends a PM to all users in the room.");
		target = target.replace(/<(?:.|\n)*?>/gm, "");

		for (let i in room.users) {
			let message = `|pm|${pmName}|${room.users[i].getIdentity()}|${target}`;
			room.users[i].send(message);
		}
		this.privateModAction(`(${user.name} mass (room) PM'ed: ${target})`);
	},
  d: "poof",
	cpoof: "poof",
	poof(target, room, user) {
		if (Config.poofOff) return this.errorReply("Poof is currently disabled.");
		if (target && !this.can("broadcast")) return false;
		if (room.id !== "lobby") return false;
		let message = target || messages[Math.floor(Math.random() * messages.length)];
		if (message.indexOf(`{{user}}`) < 0) message = `{{user}} ${message}`;
		message = message.replace(/{{user}}/g, user.name);
		if (!this.canTalk(message)) return false;

		let colour = "#" + [1, 1, 1].map(function () {
			let part = Math.floor(Math.random() * 0xaa);
			return (part < 0x10 ? "0" : "") + part.toString(16);
		}).join("");

		room.addRaw(`<strong><font color="${colour}">~~ ${message} ~~</font></strong>`);
		user.disconnectAll();
	},
	poofhelp: ["/poof - Disconnects the user and leaves a message in the room."],

	poofon(target, room, user) {
		room = this.requireRoom();
		this.checkCan('hotpatch', null, room);
		Config.poofOff = false;
		return this.sendReply("Poof is now enabled.");
	},
	poofonhelp: ["/poofon - Enable the use /poof command."],

	nopoof: "poofoff",
	poofoff(target, room, user) {
		room = this.requireRoom();
		this.checkCan('hotpatch', null, room);
		Config.poofOff = true;
		return this.sendReply("Poof is now disabled.");
	},
	poofoffhelp: ["/poofoff - Disable the use of the /poof command."],
  
  "!ship": true,
	ship(target, room, user) {
		if (!this.canTalk()) return;
		if (!this.runBroadcast()) return;
		let [first, ...second] = target.split(",").map(p => p.trim());
		if (!first || !second) return this.parse(`/shiphelp`);
		let compatibility = Math.floor(Math.random() * 100);
		this.sendReply(`${first} is ${compatibility}% compatible with ${second}.`);
	},
	shiphelp: [`/ship [first target], [second target] - Gives the compatibility of the two targets.`],
  
  "!define": true,
	def: "define",
	define(target, room, user) {
		target = toID(target);
		if (!target) return this.parse("/help define");
		if (target > 50) return this.errorReply("/define <word> - word can not be longer than 50 characters.");
		if (!this.runBroadcast()) return;

		if (toID(target) !== "constructor" && defCache[toID(target)]) {
			this.sendReplyBox(defCache[toID(target)]);
			if (room) room.update();
			return;
		}

		let options = {
			host: "api.wordnik.com",
			port: 80,
			path: `/v4/word.json/${target}/definitions?limit=3&sourceDictionaries=all&useCanonical=false&includeTags=false&api_key=${Config.defineKey}`,
			method: "GET",
		};

		http.get(options, res => {
			let data = ``;
			res.on(`data`, chunk => {
				data += chunk;
			}).on(`end`, () => {
				if (data.charAt(1) !== `{`) {
					this.sendReplyBox(`Error retrieving definition for <strong>"${target}"</strong>.`);
					if (room) room.update();
					return;
				}
				data = JSON.parse(data);
				let output = `<font color=#24678d><strong>Definitions for ${target}:</strong></font><br />`;
				if (!data[0] || !data) {
					this.sendReplyBox(`No results for <strong>"${target}"</strong>.`);
					if (room) room.update();
					return;
				} else {
					let count = 1;
					for (let u in data) {
						if (count > 3) break;
						output += `(<strong>${count}</strong>) ${data[u][`text`]}<br />`;
						count++;
					}
					this.sendReplyBox(output);
					defCache[target] = output;
					if (room) room.update();
					return;
				}
			});
		});
	},
	definehelp: ["/define [word] - Gives the definition to a word."],

	"!urbandefine": true,
	u: "urbandefine",
	ud: "urbandefine",
	urbandefine(target, room) {
		if (!this.runBroadcast()) return;
		if (!toID(target)) return this.parse("/help urbandefine");
		if (target.toString() > 50) return this.errorReply("Phrase can not be longer than 50 characters.");

		if (toID(target) !== "constructor" && udCache[toID(target)]) {
			this.sendReplyBox(udCache[toID(target)]);
			if (room) room.update();
			return;
		}

		let options = {
			host: "api.urbandictionary.com",
			port: 80,
			path: `/v0/define?term=${encodeURIComponent(target)}`,
			term: target,
		};

		http.get(options, res => {
			let data = ``;
			res.on(`data`, chunk => {
				data += chunk;
			}).on(`end`, () => {
				if (data.charAt(0) !== `{`) {
					this.sendReplyBox(`Error retrieving definition for <strong>"${target}"</strong>.`);
					if (room) room.update();
					return;
				}
				data = JSON.parse(data);
				let definitions = data[`list`];
				if (data[`result_type`] === `no_results` || !data) {
					this.sendReplyBox(`No results for <strong>"${target}"</strong>.`);
					if (room) room.update();
					return;
				} else {
					if (!definitions[0][`word`] || !definitions[0][`definition`]) {
						this.sendReplyBox(`No results for <strong>"${target}"</strong>.`);
						if (room) room.update();
						return;
					}
					let output = `<strong>${definitions[0][`word`]}</strong> ${definitions[0][`definition`].replace(/\r\n/g, `<br />`).replace(/\n/g, ` `)}`;
					if (output.length > 400) output = output.slice(0, 400) + `...`;
					this.sendReplyBox(output);
					udCache[toID(target)] = output;
					if (room) room.update();
					return;
				}
			});
		});
	},
	urbandefinehelp: ["/u [word] - Gives the Urban Definition for a word."],
  
  etour(target, room, user) {
		if (!target) return this.parse("/help etour");
		this.parse(`/tour create ${target}, elimination`);
	},
	etourhelp: ["/etour [format] - Creates an elimination tournament."],

	rtour(target, room, user) {
		if (!target) return this.parse("/help rtour");
		this.parse(`/tour create ${target}, roundrobin`);
	},
	rtourhelp: ["/rtour [format] - Creates a round robin tournament."],
  
  rf: "roomfounder",
	roomfounder(target, room, user) {
		if (!room.persist) {
			return this.errorReply("/roomfounder - This room isn't designed for per-room moderation to be added");
		}
		if (!target) return this.parse("/help roomfounder");
		target = this.splitTarget(target, true);
		let targetUser = this.targetUser;
		let name = this.targetUsername;
		let userid = toID(name);

		if (!Users.isUsernameKnown(userid)) {
			return this.errorReply(`User "${this.targetUsername}" is offline and unrecognized, and so can't be promoted.`);
		}

		room = this.requireRoom();
		this.checkCan('makeroom', null, room);

		if (!room.settings.auth) room.settings.auth = room.settings.auth = {};

		room.settings.auth[userid] = "#";
		room.settings.founder = userid;
		room.founder = userid;
		this.addModAction(`${name} was appointed Room Founder by ${user.name}.`);
		if (targetUser) {
			targetUser.popup(`|html|You were appointed Room Founder by ${Server.nameColor(user.name, true)} in ${room.title}.`);
			room.onUpdateIdentity(targetUser);
		}
		room.saveSettings();
	},
	roomfounderhelp: ["/roomfounder [username] - Appoints [username] as a room founder. Requires: & ~"],
};