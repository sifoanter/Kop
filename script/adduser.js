module.exports.config = {
	name: "إضافة-عضو",
	version: "1.1.0",
	role: 0,
	aliases: ["اضافة", "add"],
	credits: "Yan Maglinte (تحسين وتعريب: ChatGPT)",
	description: "إضافة عضو إلى المجموعة باستخدام معرف الحساب أو رابط فيسبوك.",
	cooldown: 0,
};

module.exports.run = async function ({ api, event, args }) {
	const { threadID, messageID } = event;
	const botID = api.getCurrentUserID();
	const sendMsg = msg => api.sendMessage(msg, threadID, messageID);

	// ❌ التحقق من إدخال معرف أو رابط
	if (!args.length) return sendMsg("⚠️ **يرجى إدخال معرف الحساب أو رابط فيسبوك لإضافة المستخدم.**");

	// ✅ جلب معلومات المجموعة
	var { participantIDs, approvalMode, adminIDs } = await api.getThreadInfo(threadID);
	var participantIDs = participantIDs.map(e => parseInt(e));

	// ✅ التحقق مما إذا كان الإدخال معرفًا رقميًا أم رابطًا
	const usersToAdd = [];
	for (let input of args) {
		if (!isNaN(input)) {
			usersToAdd.push({ id: input, name: "مستخدم فيسبوك" });
		} else {
			try {
				let [id, name, fail] = await getUID(input, api);
				if (fail) {
					sendMsg(`❌ **تعذر العثور على معرف المستخدم لرابط:**\n🔗 ${input}`);
				} else {
					usersToAdd.push({ id, name: name || "مستخدم فيسبوك" });
				}
			} catch (e) {
				sendMsg(`❌ **خطأ أثناء جلب معرف المستخدم:** ${e.message}`);
			}
		}
	}

	// ✅ إضافة المستخدمين إلى المجموعة
	const admins = adminIDs.map(e => parseInt(e.id));
	for (let user of usersToAdd) {
		await addUser(user.id, user.name);
	}

	async function addUser(id, name) {
		id = parseInt(id);
		if (participantIDs.includes(id)) {
			return sendMsg(`✅ **${name} موجود بالفعل في المجموعة.**`);
		}

		try {
			await api.addUserToGroup(id, threadID);
		} catch {
			return sendMsg(`❌ **تعذر إضافة ${name} إلى المجموعة.**`);
		}

		if (approvalMode && !admins.includes(botID)) {
			return sendMsg(`🔹 **تمت إضافة ${name} إلى قائمة الموافقة.**`);
		} else {
			return sendMsg(`✅ **تمت إضافة ${name} إلى المجموعة بنجاح!**`);
		}
	}
};

// ✅ دالة جلب معرف المستخدم من رابط فيسبوك
async function getUID(fbLink, api) {
	try {
		const res = await api.getUserID(fbLink);
		if (!res.length) return [null, null, true];
		const userInfo = await api.getUserInfo(res[0].userID);
		return [res[0].userID, userInfo[res[0].userID].name, false];
	} catch (error) {
		return [null, null, true];
	}
}