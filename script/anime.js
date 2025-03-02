const axios = require('axios');
const fs = require('fs');

module.exports.config = {
  name: 'أنمي', // تغيير اسم الأمر إلى العربية
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['هانمي'],
  description: 'احصل على صورة أنمي عشوائية',
  usage: "أنمي [التصنيف - النوع]",
  credits: 'المطور',
  cooldown: 5,
};

module.exports.run = async function({ api, event, args }) {
  try {
    const input = args.join(' ');

    if (!input) {
      const message = `🌸 **قائمة تصنيفات الأنمي:**\n\n🔞 **تصنيف: للبالغين (NSFW)**\n• waifu\n• neko\n• trap\n• blowjob\n\n🎀 **تصنيف: آمن (SFW)**\n• waifu\n• neko\n• shinobu\n• megumin\n• bully\n• cuddle\n• cry\n• hug\n• awoo\n• kiss\n• lick\n• pat\n• smug\n• bonk\n• yeet\n• blush\n• smile\n• wave\n• highfive\n• handhold\n• nom\n• bite\n• glomp\n• slap\n• kill\n• kick\n• happy\n• wink\n• poke\n• dance\n• cringe\n\n📝 **طريقة الاستخدام:**\n📌 أرسل: **أنمي التصنيف - النوع**\n📌 مثال: **أنمي sfw - hug**`;
      
      api.sendMessage(message, event.threadID, event.messageID);
    } else {
      const split = input.split('-').map(item => item.trim());
      const choice = split[0]; // التصنيف (sfw أو nsfw)
      const category = split[1]; // النوع (مثل hug, waifu...)

      if (!choice || !category) {
        return api.sendMessage("❌ **يرجى تحديد التصنيف والنوع بالشكل الصحيح!**\n📌 **مثال:** أنمي sfw - hug", event.threadID, event.messageID);
      }

      const time = new Date();
      const timestamp = time.toISOString().replace(/[:.]/g, "-");
      const pathPic = __dirname + `/cache/${timestamp}_anime.png`;

      // 🔹 جلب الصورة من API
      const { data } = await axios.get(`https://api.waifu.pics/${choice}/${category}`);
      const picture = data.url;
      const getPicture = (await axios.get(picture, { responseType: 'arraybuffer' })).data;

      // 🔹 حفظ الصورة مؤقتًا ثم إرسالها
      fs.writeFileSync(pathPic, Buffer.from(getPicture, 'utf-8'));
      api.sendMessage({
        body: `📸 **إليك صورة ${category} من تصنيف ${choice}**`,
        attachment: fs.createReadStream(pathPic)
      }, event.threadID, () => fs.unlinkSync(pathPic), event.messageID);
    }
  } catch (error) {
    api.sendMessage(`❌ **حدث خطأ أثناء تنفيذ الأمر:**\n🔹 ${error.message}`, event.threadID, event.messageID);
  }
};