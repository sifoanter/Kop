const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "blackbox",
  version: "2.1.0",
  role: 0,
  aliases: ["box", "python"],
  description: "بوت ذكاء اصطناعي يجيب على الأسئلة، مع تحويل الإجابة إلى صوت",
  usage: "blackbox [السؤال]",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  let { messageID, threadID } = event;
  const query = args.join(" ");

  if (!query) {
    return api.sendMessage("❔ | **يرجى إدخال سؤال أو استفسار**", threadID, messageID);
  }

  try {
    api.setMessageReaction("🕣", messageID, () => {}, true);
    api.sendMessage("🕣 | **جارٍ البحث عن الإجابة...**", threadID, messageID);

    // 🔹 استدعاء Blackbox API للحصول على الإجابة
    const boxUrl = "https://useblackbox.io/chat-request-v4";
    const boxData = {
      textInput: query,
      allMessages: [{ user: query }],
      stream: "",
      clickedContinue: false,
    };
    const boxResponse = await axios.post(boxUrl, boxData);

    if (!boxResponse.data || !boxResponse.data.response || !boxResponse.data.response[0]) {
      throw new Error("❌ | لم يتم العثور على إجابة مناسبة.");
    }

    const answer = boxResponse.data.response[0][0] || "❌ | لم يتم العثور على إجابة.";

    api.sendMessage(`📝 | **الإجابة:**\n${answer}`, threadID, messageID);

    // 🔹 تحويل الإجابة إلى صوت باستخدام MrBeast Voice API
    const beastUrl = "https://www.api.vyturex.com/beast";
    try {
      const beastResponse = await axios.get(`${beastUrl}?query=${encodeURIComponent(answer)}`);

      if (beastResponse.data && beastResponse.data.audio) {
        const audioURL = beastResponse.data.audio;
        const fileName = "mrbeast_voice.mp3";
        const filePath = path.resolve(__dirname, "cache", fileName);

        const { data: audioData } = await axios.get(audioURL, { responseType: "arraybuffer" });
        fs.writeFileSync(filePath, audioData);

        api.sendMessage(
          { body: "🔊 | **الإجابة بصوت MrBeast:**", attachment: fs.createReadStream(filePath) },
          threadID,
          () => fs.unlinkSync(filePath) // 🔹 حذف الملف بعد الإرسال
        );
      } else {
        api.sendMessage("⚠️ | **تعذر تحويل الإجابة إلى صوت.**", threadID, messageID);
      }
    } catch (beastError) {
      console.error("❌ | خطأ في MrBeast Voice API:", beastError);
      api.sendMessage("⚠️ | **تعذر تحويل الإجابة إلى صوت.**", threadID, messageID);
    }
  } catch (error) {
    console.error("❌ | خطأ في استدعاء Blackbox API:", error);
    api.sendMessage(`❌ | **حدث خطأ:**\n${error.message}`, threadID, messageID);
  }
};