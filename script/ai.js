const axios = require('axios');

module.exports.config = {
  name: 'ai',
  version: '1.0.1',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['gpt', 'openai'],
  description: "AI chatbot using OpenAI API",
  usages: "ai [prompt]",
  credits: 'Developer',
  cooldowns: 3,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const input = args.join(' ').trim();

  if (!input) {
    return api.sendMessage(`❌ **يرجى كتابة سؤال بعد 'ai'**\n🔹 **مثال:** ai ما هي عاصمة فرنسا؟`, event.threadID, event.messageID);
  }

  // 🧹 **حذف المحادثة (Clear)**
  if (input.toLowerCase() === "clear") {
    try {
      const response = await axios.post('https://موثوق_api.com/clear', { id: event.senderID });
      
      if (response.status === 200) {
        return api.sendMessage("✅ **تم مسح المحادثة بنجاح!**", event.threadID, event.messageID);
      } else {
        return api.sendMessage("⚠️ **لم يتم تنفيذ الطلب بنجاح، حاول مجددًا.**", event.threadID, event.messageID);
      }
      
    } catch (error) {
      console.error(error);
      return api.sendMessage('❌ **حدث خطأ أثناء مسح المحادثة.**', event.threadID, event.messageID);
    }
  }

  // ⏳ **إرسال رسالة انتظار**
  let chatInfoMessageID = "";
  api.sendMessage(`🤖 **يتم المعالجة...**\n🔍 *"${input}"*`, event.threadID, (error, chatInfo) => {
    if (!error) {
      chatInfoMessageID = chatInfo.messageID;
    }
  }, event.messageID);

  try {
    // 🔹 **التعامل مع الصور (إذا كانت موجودة)**
    const imageUrl = (event.type === "message_reply" && event.messageReply.attachments[0]?.type === "photo") 
      ? event.messageReply.attachments[0].url 
      : null;

    // 📡 **إرسال الطلب إلى API موثوق**
    const { data } = await axios.post('https://موثوق_api.com/chat', {
      prompt: input,
      userId: event.senderID,
      image: imageUrl
    });

    // ✅ **تعديل الرسالة بالرد من الذكاء الاصطناعي**
    api.editMessage(`🤖 **AI:** ${data.message}`, chatInfoMessageID, (err) => {
      if (err) {
        console.error(err);
        api.sendMessage(`✅ **الرد:**\n${data.message}`, event.threadID, event.messageID);
      }
    });

  } catch (error) {
    console.error(error);
    api.sendMessage('❌ **حدث خطأ أثناء معالجة الطلب.**', event.threadID, event.messageID);
  }
};