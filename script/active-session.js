const fs = require("fs");
const util = require("util");
const path = require("path");
const os = require("os");

const unlinkAsync = util.promisify(fs.unlink);
const historyFilePath = path.resolve(__dirname, '..', 'data', 'history.json');

let historyData = [];

try {
  historyData = require(historyFilePath);
} catch (readError) {
  console.error('خطأ في قراءة history.json:', readError);
}

module.exports.config = {
  name: 'الجلسات-النشطة',
  aliases: ["المستخدمين", "البوتات", "قائمة-البوتات", "قائمة-المستخدمين", "حالة-البوت"],
  description: 'يعرض جميع البوتات النشطة حاليًا.',
  version: '1.4.0',
  role: 2,
  cooldown: 0,
  credits: "AMINUL-SORDAR (تعريب وتحسين: ChatGPT)",
  hasPrefix: false,
  usage: "الجلسات-النشطة",
  dependencies: {
    "process": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const المالك = "100071880593545";  // المعرف الخاص بالمالك
  if (!المالك.includes(event.senderID)) {
    return api.sendMessage("⚠️ هذا الأمر مخصص فقط لمالك البوت.", event.threadID, event.messageID);
  }

  const { threadID, messageID } = event;

  if (args[0] && args[0].toLowerCase() === 'تسجيل-الخروج') {
    await logout(api, event);
    return;
  }

  if (historyData.length === 0) {
    api.sendMessage('⚠️ لا توجد جلسات نشطة مسجلة.', threadID, messageID);
    return;
  }

  const currentUserId = api.getCurrentUserID();
  const mainBotIndex = historyData.findIndex(user => user.userid === currentUserId);

  if (mainBotIndex === -1) {
    api.sendMessage('⚠️ البوت الرئيسي غير مسجل في البيانات.', threadID, messageID);
    return;
  }

  const mainBot = historyData[mainBotIndex];
  const mainBotName = await getUserName(api, currentUserId);
  const mainBotOSInfo = getOSInfo();
  const mainBotRunningTime = convertTime(mainBot.time);

  const userPromises = historyData
    .filter((user) => user.userid !== currentUserId)
    .map(async (user, index) => {
      const userName = await getUserName(api, user.userid);
      const userRunningTime = convertTime(user.time);
      return `🔹 **[${index + 1}]**\n👤 **الاسم:** ${userName}\n🆔 **المعرف:** ${user.userid}\n⏳ **مدة التشغيل:** ${userRunningTime}`;
    });

  const userList = (await Promise.all(userPromises)).filter(Boolean);
  const userCount = userList.length;

  const userMessage = `🤖 **البوت الرئيسي:** ${mainBotName}\n🆔 **المعرف:** ${currentUserId}\n⏳ **مدة التشغيل:** ${mainBotRunningTime}\n\n🌍 **معلومات النظام:**\n${mainBotOSInfo}\n\n📌 **الجلسات الأخرى النشطة [${userCount}]:**\n${userList.join('\n')}\n\n🔴 **لإنهاء جلسة البوت، أرسل:** "الجلسات-النشطة تسجيل-الخروج"`;

  api.sendMessage(userMessage, threadID, messageID);
};

// 🛑 دالة تسجيل الخروج
async function logout(api, event) {
  const { threadID, messageID } = event;
  const currentUserId = api.getCurrentUserID();
  const jsonFilePath = path.resolve(__dirname, '..', 'data', 'session', `${currentUserId}.json`);

  try {
    await unlinkAsync(jsonFilePath);
    api.sendMessage('✅ تم تسجيل خروج البوت بنجاح.', threadID, messageID, () => process.exit(1));
  } catch (error) {
    console.error('❌ خطأ أثناء تسجيل الخروج:', error);
    api.sendMessage('⚠️ حدث خطأ أثناء تسجيل الخروج، حاول مرة أخرى.', threadID, messageID);
  }
}

// 🧑‍💻 دالة لجلب اسم المستخدم
async function getUserName(api, userID) {
  try {
    const userInfo = await api.getUserInfo(userID);
    return userInfo && userInfo[userID] ? userInfo[userID].name : "مجهول";
  } catch (error) {
    return "مجهول";
  }
}

// 💻 دالة لجلب معلومات النظام
function getOSInfo() {
  const osInfo = `${os.type()} ${os.release()} ${os.arch()} (${os.platform()})`;
  const totalMemory = formatBytes(os.totalmem());
  const freeMemory = formatBytes(os.freemem());
  return `🖥️ **نظام التشغيل:** ${osInfo}\n⚡ **المعالج:** ${os.cpus()[0].model}\n🧠 **عدد الأنوية:** ${os.cpus().length}\n💾 **الذاكرة الكلية:** ${totalMemory}\n📉 **الذاكرة الفارغة:** ${freeMemory}`;
}

// ⏳ دالة لتحويل وقت التشغيل إلى صيغة واضحة
function convertTime(timeValue) {
  const totalSeconds = parseInt(timeValue, 10);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const remainingHours = Math.floor((totalSeconds % (24 * 60 * 60)) / 3600);
  const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${days} يوم ${remainingHours} ساعة ${remainingMinutes} دقيقة ${remainingSeconds} ثانية`;
}

// 📊 دالة لتحويل حجم البيانات إلى صيغة مفهومة
function formatBytes(bytes) {
  const sizes = ['بايت', 'ك.ب', 'م.ب', 'ج.ب', 'ت.ب'];
  if (bytes === 0) return '0 بايت';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(100 * (bytes / Math.pow(1024, i))) / 100 + ' ' + sizes[i];
}