module.exports.config = {
  name: "إدارة-الأكواد",
  version: "1.1.0",
  role: 3,
  hasPrefix: true,
  usage: '[رد برابط أو اسم ملف]',
  description: 'تحميل الأكواد من Pastebin و BuildToolDev',
  credits: 'المطور الأصلي (تحسين وتعريب: ChatGPT)',
  cooldown: 5
};

module.exports.run = async function({ api, event, args }) {
  const axios = require('axios');
  const fs = require('fs');
  const request = require('request');
  const cheerio = require('cheerio');

  const { threadID, messageID, messageReply, type } = event;
  let text = args[0];

  if (type === "message_reply" && messageReply.body) {
    text = messageReply.body;
  }

  if (!text) {
    return api.sendMessage('⚠️ **يرجى الرد على رسالة تحتوي على رابط أو إدخال اسم ملف لتحميل الكود إلى Pastebin!**', threadID, messageID);
  }

  const urlPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
  const urlMatch = text.match(urlPattern);

  // ✅ **إذا كان المستخدم يريد رفع كود محلي إلى Pastebin**
  if (!urlMatch && args[0]) {
    const filePath = `${__dirname}/${args[0]}.js`;

    fs.readFile(filePath, "utf-8", async (err, data) => {
      if (err) {
        return api.sendMessage(`⚠️ **الملف "${args[0]}.js" غير موجود!**`, threadID, messageID);
      }

      const { PasteClient } = require('pastebin-api');
      const client = new PasteClient("R02n6-lNPJqKQCd5VtL4bKPjuK6ARhHb");

      async function uploadToPastebin(name, content) {
        try {
          const url = await client.createPaste({
            code: content,
            expireDate: 'N',
            format: "javascript",
            name: name,
            publicity: 1
          });
          return url.replace('pastebin.com/', 'pastebin.com/raw/');
        } catch (error) {
          return null;
        }
      }

      const pastebinLink = await uploadToPastebin(args[1] || 'بدون_اسم', data);
      if (pastebinLink) {
        return api.sendMessage(`✅ **تم رفع الكود إلى Pastebin:**\n🔗 ${pastebinLink}`, threadID, messageID);
      } else {
        return api.sendMessage(`❌ **حدث خطأ أثناء الرفع إلى Pastebin!**`, threadID, messageID);
      }
    });

    return;
  }

  // ✅ **إذا كان المستخدم يريد تحميل كود من رابط**
  const url = urlMatch ? urlMatch[0] : null;

  if (!url) {
    return api.sendMessage('⚠️ **الرابط غير صالح!**', threadID, messageID);
  }

  if (url.includes('pastebin')) {
    axios.get(url).then(response => {
      const data = response.data;
      const fileName = `${__dirname}/${args[0]}.js`;

      fs.writeFile(fileName, data, "utf-8", function(err) {
        if (err) {
          return api.sendMessage(`❌ **حدث خطأ أثناء تحميل الكود إلى "${args[0]}.js"!**`, threadID, messageID);
        }
        api.sendMessage(`✅ **تم تحميل الكود إلى "${args[0]}.js"! استخدم الأمر "load" لتفعيله.**`, threadID, messageID);
      });
    }).catch(error => {
      api.sendMessage('❌ **حدث خطأ أثناء تحميل الكود من Pastebin!**', threadID, messageID);
    });

    return;
  }

  if (url.includes('buildtool') || url.includes('tinyurl.com')) {
    request(url, function(error, response, body) {
      if (error) {
        return api.sendMessage('❌ **حدث خطأ أثناء الاتصال بالموقع!**', threadID, messageID);
      }

      const $ = cheerio.load(body);
      const codeElement = $('.language-js').first();

      if (!codeElement || !codeElement.text()) {
        return api.sendMessage('⚠️ **لم يتم العثور على كود في الصفحة!**', threadID, messageID);
      }

      const code = codeElement.text();
      const fileName = `${__dirname}/${args[0]}.js`;

      fs.writeFile(fileName, code, "utf-8", function(err) {
        if (err) {
          return api.sendMessage(`❌ **حدث خطأ أثناء تحميل الكود إلى "${args[0]}.js"!**`, threadID, messageID);
        }
        api.sendMessage(`✅ **تم تحميل الكود إلى "${args[0]}.js"! استخدم الأمر "load" لتفعيله.**`, threadID, messageID);
      });
    });

    return;
  }

  return api.sendMessage('⚠️ **الرابط غير مدعوم! الرجاء استخدام رابط من Pastebin أو BuildToolDev.**', threadID, messageID);
};