/********************************************************************************************************************************
 * News System for Pokemon Showdown																								*
 * This Shows News via the /news view command and sends news in PMs when users connect to the server if they have subscribed	*
 * Credits: Lord Haji, HoeenHero																								*
 * @license MIT license																											*
 ********************************************************************************************************************************/

"use strict";

const FS = require("../../dist/lib/fs").FS;

let newsRequests = FS("config/newsrequests.json").readIfExistsSync();

if (newsRequests !== "") {
	newsRequests = JSON.parse(newsRequests);
} else {
	newsRequests = {};
}

function generateNews(user) {
	let newsData, newsDisplay = [];
	user = toID(user);
	Db.news.keys().forEach(announcement => {
		newsData = Db.news.get(announcement);
		newsDisplay.push(`<h4>${announcement}</h4>${newsData[1]}<br /><br />—${Server.nameColor(newsData[0], true)} <small>on ${newsData[2]}</small>`);
	});
	return newsDisplay;
}

Server.showNews = function (id, user) {
	if (!user || !id) return false;
	id = toID(id);
	let newsDisplay = generateNews(user);
	if (newsDisplay.length > 0) {
		if (newsDisplay.length > 2) newsDisplay.splice(0, newsDisplay.length - 2);
		newsDisplay = newsDisplay.join("<hr />");
		return user.send(`|pm|~${Config.serverName} News|${user.getIdentity()}|/raw ${newsDisplay}`);
	}
};

function saveNewsRequests() {
	FS("config/newsrequests.json").write(JSON.stringify(newsRequests));
}

exports.commands = {
	serverannouncements: {
		"": "view",
		display: "view",
		view(target, room, user) {
			if (!this.runBroadcast()) return;
			let output = `<center><strong>${Config.serverName} News:</strong></center>`;
      		output += generateNews().join("<hr />");
			if (this.broadcasting) return this.sendReplyBox(`<div class ="infobox-limited" ${output}</div>`);
			return user.send(`|popup||wide||html|${output}`);
		},

		remove: "delete",
		delete(target, room, user) {
			room = this.requireRoom();
			this.checkCan('news', null, room);
			if (!target) return this.parse("/help serverannouncements");
			if (!Db.news.has(target)) return this.errorReply("News with this title doesn't exist.");
			Db.news.remove(target);
			this.modlog(`NEWS`, null, `deleted announcement titled: ${target}.`);
			this.privateModAction(`(${user.name} deleted server announcement titled: ${target}.)`);
		},

		announce: "add",
		add(target, room, user) {
			room = this.requireRoom();
			this.checkCan('news', null, room);
			if (!target) return this.parse("/help serverannouncements");
			let parts = target.split(",");
			if (parts.length < 2) return this.errorReply("Usage: /news add [title], [desc]");
			let descArray = [];
			if (parts.length - 2 > 0) {
				for (let j = 0; j < parts.length; j++) {
					if (j < 1) continue;
					descArray.push(parts[j]);
				}
				parts[1] = descArray.join();
			}
			let title = parts[0], desc = parts[1], postedBy = user.name;
			let d = new Date();
			const MonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June",
				"July", "Aug", "Sep", "Oct", "Nov", "Dec",
			];
			let postTime = (`${MonthNames[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`);
			Db.news.set(title, [postedBy, desc, postTime]);
			this.privateModAction(`(${user.name} added server announcement: ${parts[0]})`);
		},
    
		request(target, room, user) {
			if (!user.named) return this.errorReply("You must have a name before requesting an announcement.");
			if (!this.canTalk()) return this.errorReply("You can't use this command while unable to speak.");
			if (!target) return this.sendReply(`/news request [message] - Requests a news announcement from the ${Config.serverName} Staff.`);
			if (target.length < 1) return this.sendReply(`/news request [message] - Requests a news announcement from the ${Config.serverName} Staff.`);
			let newsId = (Object.keys(newsRequests).length + 1);
			let d = new Date();
			let MonthNames = ["January", "February", "March", "April", "May", "June",
				"July", "August", "September", "October", "November", "December",
			];
			while (newsRequests[newsId]) newsId--;
			newsRequests[newsId] = {};
			newsRequests[newsId].reporter = user.name;
			newsRequests[newsId].message = target.trim();
			newsRequests[newsId].id = newsId;
			newsRequests[newsId].status = 'Pending';
			newsRequests[newsId].reportTime = MonthNames[d.getUTCMonth()] + ' ' + d.getUTCDate() + "th, " + d.getUTCFullYear() + ", " + (d.getUTCHours() < 10 ? "0" + d.getUTCHours() : d.getUTCHours()) + ":" + (d.getUTCMinutes() < 10 ? "0" + d.getUTCMinutes() : d.getUTCMinutes()) + " UTC";
			saveNewsRequests();
			Monitor.log(`A news request has been submitted by ${user.name}. ID: ${newsId} Request Message: ${target.trim()}`);
			Server.messageSeniorStaff(`A news requested has been submitted by ${user.name}. ID: ${newsId} Request Message: ${target.trim()}`);
			return this.sendReply(`Your request has been sent to the ${Config.serverName} global authorities.`);
		},

		help(target, room, user) {
			this.parse(`/help serverannouncements`);
		},
	},

	serverannouncementshelp: [
		`/serverannouncements view - Views current ${Config.serverName} News.
		/serverannouncements delete [news title] - Deletes announcement with the [title]. Requires @, &, ~.
		/serverannouncements add [news title], [news desc] - Adds [news]. Requires @, &, ~.
		/serverannouncements request [message] - A user may request for a news announcement to be made.`,
	],
};