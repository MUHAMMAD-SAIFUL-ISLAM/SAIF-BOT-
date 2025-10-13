module.exports = {
    config: {
        name: "authorize",
        aliases: ["auth"],
        role: 2, // only adminBot
    },
    onStart: async function ({ event, message }) {
        const threadID = event.threadID;
        let threadData = global.db.allThreadData.find(t => t.threadID == threadID);

        if (!threadData) {
            threadData = await global.db.threadsData.create(threadID);
        }

        threadData.data.isAuthorized = true;
        await global.db.threadsData.set(threadID, threadData.data);

        await message.reply("✅ This group is now authorized!");
    }
};
