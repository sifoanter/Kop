const fs = require('fs');
const path = require('path');

function readConfig() {
  const configPath = path.join(__dirname, '..', 'json', 'config.json');
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error('Error reading config:', error);
    return null;
  }
}

function isadmins(userId) {
  const config = readConfig();
  if (config && config.hasOwnProperty('admins')) {
    return config.admins.includes(userId);
  }
  return false;
}

function adminsCommand(event, api) {
  const { threadID, messageID, senderID, body } = event;
  const sendMsg = msg => api.sendMessage(msg, threadID, messageID);

  if (body.includes('-help')) {
    const usage = `🔹 **طريقة الاستخدام:** 
    \n⚙️ **admins -add [رد على المستخدم]** ➝ لإضافة مستخدم كمسؤول.
    \n⚙️ **admins -rem [رد على المستخدم]** ➝ لإزالة مستخدم من قائمة المسؤولين.
    \n📌 **ملاحظة:** فقط المسؤولين يمكنهم استخدام هذا الأمر.`;
    sendMsg(usage);
    return;
  }

  const args = body.split(' ');
  const command = args[1];

  if (command === '-add' || command === '-rem') {
    if (!isadmins(senderID)) {
      sendMsg("❌ **يجب أن تكون مسؤولاً لاستخدام هذا الأمر!**");
      return;
    }

    if (!event.messageReply) {
      sendMsg("⚠️ **يرجى الرد على رسالة المستخدم الذي تريد إضافته أو إزالته.**");
      return;
    }

    const targetID = event.messageReply.senderID;
    if (command === '-add') return addadmins(targetID, event, api);
    if (command === '-rem') return remadmins(targetID, event, api);
  } else {
    const config = readConfig();
    if (config && config.hasOwnProperty('admins')) {
      const adminsList = config.admins.map(userId => `├─⦿ ${userId}`).join('\n');
      const totaladmins = config.admins.length;
      const message = `
┌────[ 👑 **قائمة المسؤولين** ]────⦿
│
${adminsList}
│
└────[ 📌 **عدد المسؤولين: ${totaladmins}** ]────⦿
`;
      sendMsg(message);
    } else {
      sendMsg("❌ **حدث خطأ أثناء تحميل قائمة المسؤولين.**");
    }
  }
}

function addadmins(userId, event, api) {
  const { threadID } = event;
  const configPath = path.join(__dirname, '..', 'json', 'config.json');
  const config = readConfig();

  if (!config) return;

  if (!config.admins.includes(userId)) {
    config.admins.push(userId);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

    api.getUserInfo(userId, (error, data) => {
      if (error) {
        console.error(error);
        api.sendMessage("❌ **تعذر جلب معلومات المستخدم.**", threadID);
      } else {
        const name = data[userId].name;
        api.sendMessage(`✅ **تمت إضافة ${name} إلى قائمة المسؤولين.**`, threadID);
      }
    });
  } else {
    api.sendMessage("⚠️ **هذا المستخدم مسؤول بالفعل!**", threadID);
  }
}

function remadmins(userId, event, api) {
  const { threadID } = event;
  const configPath = path.join(__dirname, '..', 'json', 'config.json');
  const config = readConfig();

  if (!config) return;

  if (config.admins.includes(userId)) {
    config.admins = config.admins.filter(id => id !== userId);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

    api.getUserInfo(userId, (error, data) => {
      if (error) {
        console.error(error);
        api.sendMessage("❌ **تعذر جلب معلومات المستخدم.**", threadID);
      } else {
        const name = data[userId].name;
        api.sendMessage(`✅ **تمت إزالة ${name} من قائمة المسؤولين.**`, threadID);
      }
    });
  } else {
    api.sendMessage("⚠️ **هذا المستخدم ليس مسؤولاً!**", threadID);
  }
}

module.exports = adminsCommand;