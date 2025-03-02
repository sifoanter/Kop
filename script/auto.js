const axios = require("axios");
const fs = require("fs-extra");
const { alldown } = require("nayan-videos-downloader");

module.exports = {
  config: {
    name: "auto",
    version: "0.0.3",
    permission: 0,
    prefix: true,
    credits: "Nayan",
    description: "تحميل الفيديوهات تلقائيًا",
    category: "user",
    usages: "",
    cooldowns: 5,
  },

  handleEvent: async function ({ api, event }) {
    try {
      const content = event.body ? event.body.trim() : "";
      if (!content.startsWith("https://")) return;

      api.setMessageReaction("🔍", event.messageID, () => {}, true);

      const data = await alldown(content);
      if (!data || !data.data) throw new Error("فشل في جلب بيانات الفيديو!");

      const { high, title } = data.data;
      if (!high) throw new Error("لم يتم العثور على رابط فيديو بجودة عالية!");

      // 🔹 تحميل الفيديو
      const videoPath = __dirname + "/cache/auto.mp4";
      const videoBuffer = (await axios.get(high, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(videoPath, Buffer.from(videoBuffer, "utf-8"));

      api.setMessageReaction("✔️", event.messageID, () => {}, true);

      // 🔹 إرسال الفيديو
      api.sendMessage(
        { body: `🎬 **العنوان:** ${title}`, attachment: fs.createReadStream(videoPath) },
        event.threadID,
        () => fs.unlinkSync(videoPath), // 🔹 حذف الملف بعد الإرسال
        event.messageID
      );

    } catch (error) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage(`❌ **حدث خطأ أثناء تحميل الفيديو:**\n${error.message}`, event.threadID, event.messageID);
    }
  },
};