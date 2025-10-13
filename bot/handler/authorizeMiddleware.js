module.exports = async function ({ event, message }) {
    const threadID = event.threadID;
    const threadData = global.db.allThreadData.find(t => t.threadID == threadID);

    // যদি group authorize না থাকে
    if (!threadData || !threadData.data.isAuthorized) {
        await message.reply("❌ Group not authorized. Please contact admin.");
        return false; // command execution stop
    }

    return true; // command চলতে পারবে
};
