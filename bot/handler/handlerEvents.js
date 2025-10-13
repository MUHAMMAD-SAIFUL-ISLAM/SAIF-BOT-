const fs = require("fs-extra");
const authorizeMiddleware = require("../modules/authorizeMiddleware");

module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
    return async function (event, message) {
        const { utils, GoatBot } = global;
        const { getPrefix } = utils;
        const { threadID, body, isGroup } = event;
        if (!threadID) return;
        const senderID = event.userID || event.senderID || event.author;

        let threadData = global.db.allThreadData.find(t => t.threadID == threadID);
        let userData = global.db.allUserData.find(u => u.userID == senderID);

        if (!userData && !isNaN(senderID)) userData = await usersData.create(senderID);
        if (!threadData && !isNaN(threadID)) threadData = await threadsData.create(threadID);

        const prefix = getPrefix(threadID);
        const langCode = threadData.data.lang || GoatBot.config.language || "en";

        // ===============================
        // 1️⃣ Reply handler for /authorize
        // ===============================
        if (global.temp.authorizeReply && event.senderID == global.temp.authorizeReply.adminID) {
            const nums = body.split(/[, ]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
            const groups = global.temp.authorizeReply.groups;

            let authorized = [];
            nums.forEach(n => {
                const g = groups[n - 1];
                if (g && !g.data.isAuthorized) {
                    g.data.isAuthorized = true;
                    global.db.threadsData.set(g.threadID, g.data);
                    authorized.push(g.data.name || g.threadID);
                }
            });

            if (authorized.length)
                await message.reply(`✅ Authorized groups: ${authorized.join(", ")}`);
            else
                await message.reply("⚠️ No valid groups selected.");

            delete global.temp.authorizeReply;
            return;
        }

        // ===============================
        // 2️⃣ Command handling (onStart)
        // ===============================
        if (!body || !body.startsWith(prefix)) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        let commandName = args.shift().toLowerCase();
        let command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));

        if (command) commandName = command.config.name;

        // ✅ Authorize group middleware
        if (!await authorizeMiddleware({ event, message })) return;

        // ===============================
        // 3️⃣ Role & permission check
        // ===============================
        const role = (() => {
            const adminBot = GoatBot.config.adminBot || [];
            const adminBox = threadData ? threadData.adminIDs || [] : [];
            if (adminBot.includes(senderID)) return 2;
            else if (adminBox.includes(senderID)) return 1;
            return 0;
        })();

        const needRole = command ? (typeof command.config.role == "number" ? command.config.role : 0) : 0;
        if (needRole > role) {
            return await message.reply(needRole == 1 ? "⚠️ Only admin can use this command!" : "⚠️ Only bot admin can use this command!");
        }

        // ===============================
        // 4️⃣ Execute command
        // ===============================
        if (command && command.onStart) await command.onStart({ event, message, args, threadData, userData, prefix });
    };
};
