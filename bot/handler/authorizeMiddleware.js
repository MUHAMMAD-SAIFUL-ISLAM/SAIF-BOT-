module.exports = async function ({ event, message }) {
    const threadID = event.threadID;
    const threadData = global.db.allThreadData.find(t => t.threadID == threadID);

    if (!threadData || !threadData.data.isAuthorized) {
        await message.reply("❌ Group not authorized. Please contact admin.");
        return false; // command stop
    }
    return true; // proceed normally
};
