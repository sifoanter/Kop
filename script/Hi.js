module.exports.config = {
  name: "hi",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Sam (Edited by ChatGPT for Arabic Support)",
  usePrefix: true,
  description: "رد تلقائي بالتحية مع ملصق",
  commandCategory: "تحيات",
  usages: "[النص]",
  cooldowns: 5
}

module.exports.handleEvent = async ({ event, api, Users }) => {
  let KEY = [ 
    "سلام", "السلام عليكم", "مرحبا", "أهلا", "أهلا وسهلا",
    "مساء الخير", "صباح الخير", "هلا", "هاي", "هلا بيك", 
    "كيف حالك", "كيفك", "شلونك", "شخبارك", "مسا النور", "صباح النور"
  ];

  let thread = global.data.threadData.get(event.threadID) || {};
  if (typeof thread["hi"] == "undefined" || thread["hi"] == false) return;
  
  if (KEY.includes(event.body.toLowerCase())) {
    let data = ["422812141688367", "1775288509378520", "476426593020937", "476420733021523", "147663618749235"];
    let sticker = data[Math.floor(Math.random() * data.length)];

    let responses = [
      "كيف حالك؟",
      "أتمنى لك يومًا سعيدًا!",
      "أنا بوت دردشة، سررت بلقائك!",
      "هل شربت قهوتك اليوم؟",
      "إذا كنت تشعر بالملل، يمكنك التحدث مع المسؤول عني.",
      "حافظ على صحتك واشرب الماء!",
      "الله يسعدك!",
      "نورتني برسالتك!"
    ];
    
    let response = responses[Math.floor(Math.random() * responses.length)];

    let moment = require("moment-timezone");
    let hours = moment.tz('Africa/Algiers').format('HHmm');
    
    let session = (
      hours >= 0001 && hours <= 400 ? "ليلة سعيدة" : 
      hours >= 401 && hours <= 1100 ? "صباح الخير" :
      hours >= 1101 && hours <= 1500 ? "ظهيرة سعيدة" : 
      hours >= 1501 && hours <= 1900 ? "مساء الخير" : 
      hours >= 1901 && hours <= 2400 ? "ليلة سعيدة" : 
      "وقت غير معروف"
    );

    let days = {
      "Sunday": "الأحد",
      "Monday": "الإثنين",
      "Tuesday": "الثلاثاء",
      "Wednesday": "الأربعاء",
      "Thursday": "الخميس",
      "Friday": "الجمعة",
      "Saturday": "السبت"
    };
    
    let day = days[moment.tz('Africa/Algiers').format('dddd')];

    let name = await Users.getNameUser(event.senderID);
    let mentions = [{ tag: name, id: event.senderID }];
    
    let message = `مرحبا ${name}! اليوم ${day}، أتمنى لك ${session}. ${response}`;
    
    let msg = { body: message, mentions };
    api.sendMessage(msg, event.threadID, (e, info) => {
      setTimeout(() => {
        api.sendMessage({ sticker: sticker }, event.threadID);
      }, 100);
    }, event.messageID);
  }
}

module.exports.languages = {
  "ar": {
    "on": "مُفعل",
    "off": "مُعطل",
    "successText": `${this.config.name} تم بنجاح!`
  },
  "en": {
    "on": "on",
    "off": "off",
    "successText": `${this.config.name} success!`
  }
}

module.exports.run = async ({ event, api, Threads, getText }) => {
  let { threadID, messageID } = event;
  let data = (await Threads.getData(threadID)).data;
  data["hi"] = !data["hi"];
  
  await Threads.setData(threadID, { data });
  global.data.threadData.set(threadID, data);
  
  return api.sendMessage(`${data["hi"] ? getText("on") : getText("off")} ${getText("successText")}`, threadID, messageID);
}