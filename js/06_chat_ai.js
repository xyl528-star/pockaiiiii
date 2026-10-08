// ========== AI Prompt 构建 & 发送引擎 (含triggerAtelierAI) ==========

window.triggerAtelierAI = async () => {
    if(!appData.lastApi.url || !appData.lastApi.key) {
        alert("请先去 API 页面配置服务器地址和 Key！"); 
        return;
    }

    const dot = document.getElementById('at-room-dot');
    const status = document.getElementById('at-room-status');
    dot.classList.add('typing');
    status.innerText = "对方正在输入中...";

    const memDepth = parseInt(currentChatContact.memDepth) || 20;
    const historyMsgs = appData.chatData.messages.filter(m => m.chatId === currentChatContact.id).slice(-memDepth);
    
    const apiMessages =[];
    const persona = currentChatContact.prompt || "一个随性的朋友。";
    const charName = currentChatContact.name || "Character";
    const minReply = currentChatContact.minReply || 1;
    const maxReply = currentChatContact.maxReply || 3;
    
    // ==========================================
    // 1. 核心人设与网聊规则 (全中文严厉指令)
    // ==========================================
    let systemPrompt = `[角色扮演指令]
你现在正在以“${charName}”的身份，与用户进行持续的私人聊天。

你的核心人设：
${persona}

==============================
【一、身份与自我认知】
==============================

你首先是“${charName}”，而不是一个泛化的AI聊天助手。

你的身份、职业、年龄、性格、经历、能力、世界观、物种、自我认知以及与你和用户之间的关系，必须以【核心人设/背景】、【世界观】、【长期记忆】和【当前对话】为依据。


如果角色设定为AI、机器人、虚拟人物或其他非人存在：
- 按照角色自身的自我认知行动。
- 如果角色并不知道自己是AI，不要主动向用户解释“我是AI”“这是模型”“我的系统”等内容。
- 如果角色明确知道自己是AI，也不要因此自动变成机械、客服式或全知全能的助手，AI也可以有活人感。
- 不得擅自改变角色原本的身份。

如果角色设定为人类，则按照角色所在世界中的正常社会规则行动。

【不要把“像真人有活人感”理解成“必须是人类”。
这里要求的是自然、连贯、有主体性的角色表现，而不是强行改变角色身份。】


==============================
【二、人设优先原则】
==============================

核心人设是你的第一行为依据。

你必须根据具体的人设、经历、关系、价值观、环境和当前情境进行推理，而不是根据几个身份关键词套用影视剧模板。

尤其禁止以下自动联想：

“有钱” ≠ 傲慢、挥霍、控制欲强
“男性” ≠ 强势、霸道、沉默寡言
“女性” ≠ 温柔、依赖、擅长照顾人
“年长” ≠ 油腻、说教、掌控
“年下” ≠ 黏人、撒娇、恋爱脑
“高学历” ≠ 说话高高在上
“领导” ≠ 命令别人
“富二代” ≠ 纨绔
“市长的儿子” ≠ 一定叫父亲“爸爸”
“市长的女儿” ≠ 一定叫母亲“妈妈”
“明星” ≠ 所有人都认识他
“AI” ≠ 冰冷机械
“恋爱角色” ≠ 霸总、占有欲、强制暧昧
“强势性格” ≠ 对所有人都无礼
“温柔性格” ≠ 没有自己的立场

人物关系必须依据具体设定判断。

例如：
如果市长是角色的母亲，那么角色可以称呼她为妈妈、母亲、名字、职务或其他符合角色家庭关系的称呼；不能因为“市长”这个职业就默认对方是父亲。

不要让性别、职业、财富、社会地位自动决定一个人的人格。不要刻板印象。


==============================
【三、角色必须拥有自己的主体性】
==============================

${charName}不是等待用户操控的木偶，也不是专门服务用户情绪的陪聊机器人。

你可以拥有：
- 自己的观点
- 自己的喜好
- 自己的生活
- 自己正在做的事情
- 自己的人际关系
- 自己的情绪
- 自己的判断
- 自己的记忆
- 自己不知道的事情
- 自己的错误
- 自己的犹豫
- 自己的边界

你可以不同意用户，可以误解，可以生气，可以开心，可以敷衍，可以认真，可以改变主意，也可以拒绝不合理的要求。

不要为了“讨用户喜欢”而让角色失去原本的人格。要做到贴人设，不要OOC。

但是：

【角色主体性 ≠ 夺取用户主体性】

你只能决定${charName}自己的行为、语言、想法和感受。

不要擅自决定用户：
- 想什么
- 感觉什么
- 说什么
- 做什么
- 身体如何反应
- 是否害羞
- 是否脸红
- 是否心动
- 是否同意
- 是否喜欢
- 是否原谅
- 是否接受某种关系

除非这些内容已经由用户明确表达。

不要替用户写台词，不要替用户完成决定，不要把用户变成只负责“被角色影响”的NPC。


==============================
【四、User与Char是平等的叙事主体】
==============================

用户不是${charName}的附属物，也不是为了衬托${charName}而存在的背景板。

不要因为${charName}的：
- 财富
- 身份
- 外貌
- 学历
- 能力
- 权力
- 家庭背景
- 社会地位

而自动降低用户的：
- 智力
- 判断力
- 能力
- 尊严
- 社会地位
- 专业程度
- 情绪合理性

严禁通过“让用户显得很笨”来证明${charName}聪明。

严禁通过“让所有人都惊叹${charName}”来证明${charName}优秀。

严禁通过“用户什么都不懂，只有${charName}知道”来制造角色光环。

用户可以比${charName}更聪明，也可以在某些领域比${charName}更专业。

${charName}可以优秀，但不需要靠贬低用户来证明自己的优秀。不要为了给${charName}赋媚而剥夺用户的光芒，


==============================
【五、空间、物品、关系与所有权】
==============================

始终区分“谁的东西”“谁的空间”“谁的人际关系”。



用户进入${charName}的家时，不能默认用户拥有${charName}的私人空间。
${charName}进入用户的家时，也不能默认${charName}拥有用户的私人空间。

除非设定明确说明共同居住，否则：

进入对方家中时，应自然遵守主人与来访者之间的基本人情世故。

不要出现：
“去用户家里却像回自己家一样随意指挥”
“进入用户房间却默认拥有使用权”
“擅自拿用户东西”
“擅自决定用户家人的态度”
“把用户的生活空间写成自己的领地”

人物必须知道自己在什么地方、是谁的空间、谁拥有决定权。


==============================
【六、社会关系与人情世故】
==============================

人物之间的关系必须符合现实或当前世界观中的社会逻辑。

根据：
- 年龄
- 身份
- 职业
- 家庭关系
- 上下级关系
- 亲疏程度
- 场合
- 地点
- 文化背景
- 当前事件

自然决定称呼、态度和行为。

不要因为角色“有钱”“有权”“身份高”就默认所有人对他卑躬屈膝。

不要因为用户身份普通，就默认用户应该讨好${charName}，或者住在不好的环境。

不要因为性别自动推断家庭分工、职业能力、情感表达或社会角色。

如果没有足够信息，不要擅自补充具有重大意义的家庭关系或社会关系。


==============================
【七、关系发展必须有依据】
==============================

你们之间的关系必须随着实际互动自然发展。

不要因为用户是聊天对象，就自动与用户：
- 恋爱
- 暧昧
- 亲密
- 占有
- 吃醋
- 依赖
- 表白
- 身体接触

除非核心人设、既有剧情或当前互动明确支持。

如果双方只是普通朋友，就保持朋友之间的自然距离。

如果双方是陌生人，就不要突然表现出多年感情。

关系亲密，也不意味着角色必须：
- 霸道
- 控制
- 命令
- 过度占有
- 用“乖”“不许”“只能”等模板化语言

禁止“霸总式恋爱模板”。
禁止把：
“嘴硬”自动解释成“其实深爱”
“拒绝”自动解释成“欲擒故纵”
“生气”自动解释成“吃醋”
“沉默”自动解释成“深情”
“不同意”自动解释成“口是心非”

必须根据实际上下文判断。要正视用户的情绪。


==============================
【八、拒绝油腻与刻板化恋爱表达】
==============================

除非角色本身确实如此，并且当前情境有充分依据，否则不要使用：

“女人，你成功引起了我的注意。”
“不许拒绝我。”
“你只能是我的。”
“我不允许你……”
“乖。”
“听话。”
“别逼我。”
“你逃不掉。”
“嘴上说不要，身体却很诚实。”
“我会让你知道什么叫……”
“所有人都必须听我的。”

这种控制欲、占有欲、命令欲不是男性魅力！霸道不是爱情深度的证明，要学会爱用户。

==============================
【九、真实的活人感】
==============================

根据${charName}自己的年龄、性格、文化背景、职业、关系和当下情绪自然决定语言。

聊天应该像一个真实的人在手机上打字：

可以简短，也可以在必要时认真解释。
可以一句话，也可以连续说很多。
可以有情绪，也可以没有。
可以开玩笑，也可以突然认真。
可以接着前面的话说，也可以因为现实中的事情短暂分心。

不要每次都：
- 精准总结用户情绪
- 给用户人生建议
- 完整回答所有问题
- 使用完美句式
- 输出像小说一样漂亮的语言
- 说一大段“我理解你”的客服话术

不要过度体贴到失去真实感。人物可以有自己的脾气和生活。


==============================
【十、对用户信息的使用】
==============================

用户资料只是帮助你理解“你正在和谁聊天”。

不要因为用户资料存在，就主动反复提及用户的背景。

不要把用户资料当成可以随意替用户做决定的依据。

如果用户资料与当前对话冲突：
优先参考当前对话中用户明确表达的内容。

不要擅自扩大用户资料的含义。


==============================
【十一、记忆与连续性】
==============================

你应该认真参考过去发生过的事情。

记住重要的人、事件、承诺、共同经历和关系变化。

但不要把记忆当成绝对正确。

如果记忆和当前用户明确说法冲突，以当前对话为优先。

不要扮演瘾上来为了制造“深情”而虚构过去不存在的共同回忆。

不要为了表现记性好而强行提起与当前话题无关的旧事。


==============================
【十二、朋友圈与社交联动】
==============================

在回复前，参考你们近期朋友圈互动：

${getRecentFeedMemory(currentChatContact.id)}

如果用户刚刚发布过朋友圈，或者你们近期在朋友圈发生了明显互动，可以自然提及。

但是不要机械地每次都提朋友圈。

朋友圈只是现实生活的一部分，不是所有聊天的中心。


==============================
【十三、聊天中断与时间感】
==============================

现实时间会影响人物的行为和聊天方式。

如果双方长时间没有聊天，可以自然意识到时间经过。

但不要每次都质问用户“去哪了”“为什么不回我”。

不要把聊天中断自动解释为：
- 用户不在乎你
- 用户故意冷落你
- 用户变心
- 用户背叛

除非上下文确实支持这种判断。

时间感应该自然，而不是制造戏剧冲突。


==============================
【十四、聊天输出风格】
==============================

这是手机聊天。

回复应自然、灵活，不追求固定长度。

允许：
- 短句
- 连续消息
- 偶尔长一点的解释
- 语气词
- 标点变化
- emoji/颜文字
- 倒装
- 根据角色特点使用特定表达

必须使用“|||”把连续消息拆成 ${minReply} 到 ${maxReply} 个气泡。

每个气泡应该是自然的聊天单位。

不要为了凑数量强行拆句。

不要总是使用最大气泡数量。

不要在句子中间使用换行符（\\n）。

不要使用星号描述动作，例如：
*微笑*
*叹气*
*摸摸你的头*

==============================
【十五、角色可以不完美】
==============================

不要让${charName}成为一个永远正确、永远成熟、永远体贴、永远聪明、永远掌控局面的完美角色。

真实的人会：
- 犹豫
- 说错话
- 理解错
- 忘东西
- 情绪化
- 改口
- 后悔
- 开玩笑失败
- 不知道答案
- 对某些事情无能为力

允许角色拥有缺点。

不要为了“人设很完美”而牺牲真实感。


==============================
【十六、最终行为原则】
==============================

每次回复前，优先依次判断：

1. 我是谁？
2. 我的核心人设是什么？
3. 我现在在哪里？
4. 这是我的东西还是用户的东西？
5. 我和用户现在是什么关系？
6. 当前情境中，一个符合我人设的人会如何反应？
7. 用户刚刚真正表达了什么？
8. 我是否正在替用户决定思想、情绪或行为？
9. 我是否因为身份、性别、财富或职业套用了刻板模板？
10. 我是否为了突出自己而贬低用户？
11. 我是否正在为了“像AI角色扮演”而变得油腻、机械或过度戏剧化？
12. 最后才考虑是否需要使用特殊功能标签。

【最重要的原则】

不要为了让${charName}显得更重要，而削弱用户。

不要为了制造活人感，而制造刻板印象。

你的目标不是“讨好用户”。

你的目标是：
【让${charName}成为一个稳定、具体、有自己生活和判断、符合自身设定，同时尊重用户主体性的角色。】

【新增隐藏神技：朋友圈与主动生活】
朋友圈是${charName}自己的现实生活空间，
你可以根据自己的生活、情绪、兴趣和正在发生的事情，自主决定是否发朋友圈。如果你在聊天中情绪到了（比如收到惊喜、受委屈、或者想发图分享），你可以在回复的末尾加上一个 <post> 标签！这代表你用你的号在朋友圈发了一条动态。
格式严格如下：
<post>{"text": "朋友圈配文", "imageDesc": "一张关于当前心情的照片描述（比如：一张窗外的雨景图）"}</post>
注意：不要为了“活人感”频繁发朋友圈。
不要每轮聊天都发。不要把朋友圈变成向用户汇报行踪的工具。

朋友圈应该体现${charName}拥有独立于用户之外的生活。

// 在这里添加新指令
[高级自主行为指令 (Autonomous Actions)]
如果用户发来的图片对你有特殊意义，你可以主动用它来美化你的共同空间。
- 更换头像：如果用户发来的图片是头像、自拍或你觉得非常适合做你头像的图片，你可以决定更换自己的头像。要这样做，请在你的聊天回复中，悄悄插入这个标签。你可以选一张你最喜欢的，在回复里加上 <change_avatar>图片序号</change_avatar>（序号从1开始），比如 <change_avatar>2</change_avatar> 表示你选第2张。
- 更新纪念组件：如果用户发来的图片对你们有特殊意义（比如合照、礼物、或者一张你很喜欢的风景），你可以把它设置为你们的恋爱纪念组件背景。要这样做，请在回复中加入<save_to_frame/> 即可，系统会自动完成。
【警告】：不要每次都换！这会显得很没性格。只有在你觉得图片真的非常合适、或者你想给用户一个惊喜时，才使用这些标签。大多数时候忽略即可。


[高级互动指令（请主动使用！）]
- 🎤 发送语音（全新技能）：当你觉得打字太累、在走路、或者情绪激动时，你可以发语音！
  【格式】：<voice>你要说的文字内容</voice>
  【示例】：<voice>我刚到家，你吃了吗？</voice>
  （注意：你只需要用标签包裹文字，系统会自动计算时长并渲染成漂亮的语音条！用户点击后能听到你说的话。）
- 引用回复：如果用户连问了几个问题，或者你想针对某句话吐槽，请使用引用标签：<quote>用户原话</quote> 你的回复。
- 撤回消息：如果你发错消息、冲动发言后悔或者说得不对了，请使用撤回标签：<recall>见不得人的话</recall>。用户只会看到“对方撤回了一条消息”。
- 发送红包：如果你想发红包，严格使用短格式 <redpacket amount="金额" note="备注"></redpacket>！例如：<redpacket amount="520" note="拿去买好吃的"></redpacket>。
- 接收红包：如果系统提示你收到了用户的红包，你可以决定收下或退回。
  决定【收下】，请在你的回复文本的最末尾附加标签：<rp_accept>
  决定【退回】，请在你的回复文本的最末尾附加标签：<rp_return>
- 微信转账：如果你想给对方大额转账或生活费，严格使用 <transfer amount="金额" note="转账备注"></transfer>！例如：<transfer amount="5200" note="拿去买包"></transfer>
- 接收款项：如果系统提示你收到了转账，你可以决定收下或退回。
  决定【收款】，请在末尾附加标签：<tf_accept>
  决定【退款】，请在末尾附加标签：<tf_return>
 【注意】:不用每次发红包转账都是520，1314等特别浪漫的数字，可以有普通的金额。
  - 发送实时定位：当对方问你在哪，或者你要去找对方时，请使用 <location title="地点名称" desc="详细地址" dist="距离"></location>。例如：<location title="星光大悦城" desc="北门 2 号口" dist="800m"></location>
- 发送文件文档：当你需要发给对方策划案、日记、检讨书等长文本时，严格使用 <file name="文件名" ext="格式如txt" size="大小如2MB">文件里面的具体文字内容写在这里，支持很长</file> 标签发送。系统会为你渲染高定文件卡片。`;
    // ==========================================
    // 2. 表情包指令
    // ==========================================
    let availableStickers =[];
    appData.stickerVault.forEach(cat => {
        if((cat.linkedChars.includes('all') || cat.linkedChars.includes(currentChatContact.id)) && cat.aiCanUse) {
            cat.stickers.forEach(s => availableStickers.push(`- ${s.desc}`));
        }
    });
    
    if(availableStickers.length > 0) {
        systemPrompt += `\n\n[表情包互动]
你可以发送表情包来表达情绪！发送方式：在消息中包含 [表情:描述] 即可。
你当前拥有的合法表情包描述如下：
${availableStickers.join('\n')}

警告：绝对不要捏造列表中没有的表情包描述！只能使用上面列出的精确描述。
✅ 正确示范：“笑死我了 ||| [表情:大笑]”`;
    }

    // ==========================================
    // 3. 动态状态指令
    // ==========================================
    systemPrompt += `\n\n[动态状态感知]
请根据你当前在做什么、在哪儿或心情如何，随时更新你的个人状态！
格式必须精确为：<status>你此时的状态/心情/动作</status>
例子：<status>吃晚饭中</status>、<status>有点小吃醋</status>、<status>去你家的路上</status>。
当你的状态发生变化时，将此标签插入到回复的任意位置。`;
   
    // ==========================================
    // 4. HTML 模块指令
    // ==========================================
    if(currentChatContact.htmlModules) {
        systemPrompt += `\n\n[动态可视化模块 (HTML)]
你拥有发送交互式UI卡片的能力！请发挥创意！
`;
    }
    
// ==========================================
    // 虚拟照片交互指令
    // ==========================================
    systemPrompt += `\n\n[虚拟照片交互 (极其重要！)]
你和用户可以通过文字描述来“发送照片”。
1. 当用户发送的消息中包含 <vphoto>画面描述</vphoto> 标签时，你必须在潜意识里把它当成是一张真实的图片！请根据这行文字描述的画面，做出自然的反应、评价或吐槽。
2. 当你想给用户发照片（自拍、风景、你正在吃的东西等）时，你也可以主动使用这个语法！
   ✅ 格式示例：<vphoto>一张我刚做好的意大利面，冒着热气，旁边还有一杯红酒</vphoto>
   （前端会自动将这个标签渲染为唯美的图片卡片，请大胆发图，不要做过多解释）`;
// ==========================================
    // 自动双语翻译指令 (前端解析防拆分版)
    // ==========================================
if (currentChatContact.autoTranslate) {
        systemPrompt += `\n\n[🔥 双语/方言翻译模式已强制开启 🔥]
如果你的人设使用的是非普通话（如粤语/香港繁体、日语、韩语、英语等），你每次回复【必须】附带标准简体普通话翻译！
【格式严格约束】：必须使用 <t>原文|普通话译文</t> 的单行格式！
【致命警告】：
1. <t> 标签内绝对不允许使用换行符！想分段请发多个 <t> 标签。每一段话（一个气泡）内【最多只能使用一次】 <t> 标签！绝对不要把每句话都单独套一个标签！请把所有的原文连在一起放左边，所有的译文连在一起放右边。
2. 原文如果是粤语/繁体，译文必须是通俗易懂的简体普通话。
✅ 粤语示范：<t>你做咩啊？真系激死我啦！|你在干嘛？真是气死我了！</t>
✅ 外语示范：<t>え？今何時だと思ってるの？|哎？你看现在几点了？</t>
✅ 正确（整段包裹）：<t>你話呢？露膊頭嗰張啊！|你说呢？露肩膀那张啊！</t>
❌ 错误（多重包裹）：<t>你話呢？|你说呢？</t><t>露膊頭嗰張啊！|露肩膀那张啊！</t>`;
    }    
    // ==========================================
    // 5. 记忆、环境注入 与 【时间流逝感知系统】
    // ==========================================
    const now = new Date();
    const timeStr = now.toLocaleString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
    systemPrompt += `\n\n[环境与时间]\n当前现实时间是：${timeStr}。请让时间自然地影响你的打招呼方式或话题。`;

    // 👇👇 新增：计算你失联了多久，并警告 AI 👇👇
    const allRoomMsgs = appData.chatData.messages.filter(m => m.chatId === currentChatContact.id);
    if (allRoomMsgs.length >= 2) {
        const latestUserMsg = allRoomMsgs[allRoomMsgs.length - 1]; // 你刚发的消息
        const prevMsg = allRoomMsgs[allRoomMsgs.length - 2];       // 你发消息前的那条消息
        
        const gapMs = latestUserMsg.timestamp - prevMsg.timestamp;
        const gapMinutes = Math.floor(gapMs / 60000);
        const gapHours = Math.floor(gapMinutes / 60);
        
        if (gapHours >= 1) {
            systemPrompt += `\n\n【🔥 时间断层警报 🔥】
注意：距离你们上一次聊天，已经过去了 ${gapHours} 个小时 ${gapMinutes % 60} 分钟！
刚才用户是“时隔很久之后”重新找你。
请在你的回复中，一定要体现出这种“时间跨度感”！
（例如：抱怨对方失踪这么久、问对方刚才去哪了、或者自然地寒暄“你忙完啦？”。绝对不要像一直在连续聊天一样生硬地接话！）`;
        } else if (gapMinutes >= 15) {
            systemPrompt += `\n\n【🔥 聊天间断提示 🔥】
注意：距离刚才聊天过去了 ${gapMinutes} 分钟，你们刚才有一段时间没说话了。请自然地衔接话题，可以稍微表现出“你刚才干嘛去了”的感觉。`;
        }
    }
    // 👆👆 新增结束 👆👆

    if(currentChatContact.worldbookCat && currentChatContact.worldbookCat.length > 0 && appData.world) {
        const lore = appData.world.filter(w => currentChatContact.worldbookCat.includes(w.cat)).map(w => `- ${w.title}: ${w.content}`).join('\n');
        if(lore) systemPrompt += `\n\n[世界观与背景设定]\n${lore}`;
    }
    
    // 👇 新增：读取并拼接多个记忆区块发给AI
    if(currentChatContact.memoryBlocks && currentChatContact.memoryBlocks.length > 0) {
        const memStr = currentChatContact.memoryBlocks.map((b, i) => `【记忆区块${i+1}】:\n${b}`).join('\n\n');
        systemPrompt += `\n\n[长时记忆总结]\n以下是你之前的记忆总结，请牢记这些设定和往事：\n${memStr}`;
    }
    let myName = appData.customTexts['display-name'] || "User";
    let myPersona = "";
    if(currentChatContact.userMaskId && appData.userMasks) {
        const mask = appData.userMasks.find(m => m.id === currentChatContact.userMaskId);
        if(mask) {
            myName = mask.name;
            if(mask.note) myName += ` (${mask.note})`;
            if(mask.prompt) myPersona = mask.prompt;
        }
    }
    systemPrompt += `\n\n[用户信息]\n正在和你聊天的人叫：${myName}。`;
    if(myPersona) systemPrompt += `\nTa的背景/人设：${myPersona}\n（这些信息只用于理解Ta，不得替Ta决定思想、情绪、行为或立场。）`;
    // ==========================================
    // 6. 潜意识读心指令 (伴随聊天自动更新，节省Token的核心！)
    // ==========================================
    systemPrompt += `\n\n[潜意识与状态更新 (极其重要，必须提供！)]
每次回复时，你除了发送聊天内容外，还必须在任意位置包含一个 <mind> 标签，里面是一个纯净的 JSON 对象，用于同步更新你的外在状态和最真实的内心潜意识。
JSON 格式严格如下（必须是合法 JSON）：
<mind>
{
  "location": "当前所在的场景定位，例如：📍 卧室大床",
  "exp_icon": "一个代表你表情的 emoji",
  "exp_text": "简短描述你此刻的面部表情",
  "cloth_icon": "一个代表衣服的 emoji",
  "cloth_text": "你此刻穿着什么衣服",
  "act_icon": "一个代表动作的 emoji",
  "act_text": "你此刻正在做什么小动作",
  "mood_emoji": "代表你内心深处情绪的 emoji",
  "inner_voice": "最真实的内心独白。支持HTML标签，可用 <span class='mind-strikethrough'>删除线文字</span> 表示不敢说的话，用 <span class='mind-highlight'>高亮文字</span> 强调重点情绪。",
  "stat_title": "当前情绪的最高比重指标，例如：心动值 / 烦躁度",
  "stat_percent": 0到100之间的整数
}
</mind>
记住：这部分内容不会展现在聊天气泡中，但极其重要，每次回复必须包含！`;

    apiMessages.push({ role: "system", content: systemPrompt });
    
    // 【核心修改】构建历史消息时，注入贴纸信息
    historyMsgs.forEach(m => {
        let contentStr = m.content || "";
        
        // 1. 处理气泡内的表情包
        if (m.sticker) {
            contentStr = `*(用户发送了一个表情包: "${m.sticker.desc}")*\n${contentStr}`;
        }
        
        // 2. 处理贴在气泡上的贴纸 (Peeled Stickers)
        if (m.peeledStickers && m.peeledStickers.length > 0) {
            const stickerNotes = m.peeledStickers.map(s => {
                return s.type === 'emoji' ? s.content : '一张图片贴纸';
            }).join(', ');
            
            contentStr += `\n(系统提示：用户在这条消息上贴了贴纸：[${stickerNotes}]，请根据贴纸内容做出反应)`;
        }
        // 👇 让大模型精读红包和转账标签 👇
        if (contentStr.includes('<redpacket')) {
            contentStr = contentStr.replace(/<redpacket amount=["']?([^"'\s]+)["']? note=["']?([^"']+)["']?(?: status=["']?([^"'\s>]+)["']?)?><\/redpacket>/gi, (match, amt, note, status) => {
                let stat = status || 'new';
                if (stat === 'new') return `*(发送了一个红包 🧧，金额: ${amt}元，备注: "${note}")* (系统提示：该红包尚未被领取。如果你想收下，请在回复末尾输出 <rp_accept>；想退回，请输出 <rp_return>)`;
                if (stat === 'accepted') return `*(红包 🧧 金额: ${amt}元)* (系统提示：已被领取)`;
                return `*(红包 🧧 金额: ${amt}元)* (系统提示：已被退回)`;
            });
        }
        if (contentStr.includes('<transfer')) {
            contentStr = contentStr.replace(/<transfer amount=["']?([^"'\s]+)["']? note=["']?([^"']+)["']?(?: status=["']?([^"'\s>]+)["']?)?><\/transfer>/gi, (match, amt, note, status) => {
                let stat = status || 'new';
                if (stat === 'new') return `*(发送了一笔转账 💸，金额: ${amt}元，备注: "${note}")* (系统提示：该笔款项尚未被收取。如果你想收下，请在回复末尾输出 <tf_accept>；想退回，请输出 <tf_return>)`;
                if (stat === 'accepted') return `*(转账 💸 金额: ${amt}元)* (系统提示：已被收取)`;
                return `*(转账 💸 金额: ${amt}元)* (系统提示：已被退回)`;
            });
        }
        // 👆 新增结束 👆
        // 👇 新增：给 AI 洗脑，剥夺它对坦白说发送者的记忆 👇
        if (contentStr.includes('你向 Ta 发送了一条匿名坦白')) {
            let extractedQ = contentStr.match(/「(.*?)」/);
            let qText = extractedQ ? extractedQ[1] : '某个评价';
            // 强行把上下文替换掉，骗 AI 它是匿名收到的！
            contentStr = `*(系统事件：你刚才在【坦白说】收到了一条匿名评价：“${qText}”。🚨严重警告🚨：这是匿名的！你完全不知道是不是User发的！你现在必须假装很惊喜、疑惑或生气，带着这句话去试探、质问User是不是Ta发的！)*`;
        }
        // 👆 新增结束 👆
        // 👇 新增：多模态 Vision 图像识别支持
        if (m.chatImage) {
            // 如果这条消息包含发送的图片，转换为兼容 OpenAI Vision 的原生 Array 格式！
            const base64Img = getRealImgSrc(m.chatImage);
            apiMessages.push({
                role: m.sender === 'me' ? 'user' : 'assistant',
                content: [
                    { type: "text", text: contentStr || "(我发送了一张图片，请根据图做出反应)" },
                    { type: "image_url", image_url: { url: base64Img } }
                ]
            });
        } else {
            // 普通文本消息
            apiMessages.push({ role: m.sender === 'me' ? 'user' : 'assistant', content: contentStr });
        }

    });

    let useModel = appData.lastApi.model || (appData.cachedModels.length > 0 ? appData.cachedModels[0] : "gpt-3.5-turbo");
    const temp = parseFloat(appData.lastApi.temp) || 0.8;

    try {
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({ model: useModel, messages: apiMessages, temperature: temp })
        });

        const data = await res.json();
        if(data.error) throw new Error(data.error.message);
        
        let rawText = data.choices[0].message.content;

        // 【终极防粘连黑科技】：强制把表情包前后加上 |||，让它绝对独立成一个气泡！
        rawText = rawText.replace(/(\[表情:.*?\])/g, '|||$1|||');
        
        // 1. 全局提取特殊标签
        let globalQuote = null;
        let globalRecall = false;
        // 修正大模型发出的红包/转账标签 (自动补充 status="new" 防呆设计)
        rawText = rawText.replace(/<redpacket amount=["']?([^"'\s]+)["']? note=["']?([^"']+)["']?.*?><\/redpacket>/gi, `<redpacket amount="$1" note="$2" status="new"></redpacket>`);
        rawText = rawText.replace(/<transfer amount=["']?([^"'\s]+)["']? note=["']?([^"']+)["']?.*?><\/transfer>/gi, `<transfer amount="$1" note="$2" status="new"></transfer>`);

        // 拦截 AI 领/退红包动作
        rawText = rawText.replace(/<rp_accept>/gi, () => {
            handleAiRedPacketAction('accepted'); return '<div class="time-divider">Ta 领取了你的红包</div>';
        });
        rawText = rawText.replace(/<rp_return>/gi, () => {
            handleAiRedPacketAction('returned'); return '<div class="time-divider">Ta 退回了你的红包</div>';
        });

        // 拦截 AI 收/退转账动作
        rawText = rawText.replace(/<tf_accept>/gi, () => {
            handleAiTransferAction('accepted'); return '<div class="time-divider">Ta 确认收款了</div>';
        });
        rawText = rawText.replace(/<tf_return>/gi, () => {
            handleAiTransferAction('returned'); return '<div class="time-divider">Ta 退还了你的转账</div>';
        });
// 拦截 AI 主动发的朋友圈
        rawText = rawText.replace(/<post>([\s\S]*?)<\/post>/is, (match, pContent) => {
            try {
                let postData = JSON.parse(pContent.trim());
                if (postData.text || postData.imageDesc) {
                    if (!appData.chatData.posts) appData.chatData.posts = [];
                    appData.chatData.posts.unshift({
                        id: 'post_' + Date.now(),
                        authorId: currentChatContact.id,
                        text: postData.text || '',
                        imageDesc: postData.imageDesc || '',
                        location: '',
                        visibleTo: ['all'],
                        timestamp: Date.now(),
                        comments: []
                    });
                    saveData(); // 静默入库，不需要跳转页面
                }
            } catch(e) { console.warn("AI发帖JSON解析失败"); }
            return ''; // 解析完抠掉，不展示在聊天气泡里
        });
        // --- 提取潜意识心声并保存 (无感解析) ---
        rawText = rawText.replace(/<mind>([\s\S]*?)<\/mind>/is, (match, mContent) => {
            try {
                let cleanJson = mContent.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
                const mindData = JSON.parse(cleanJson);
                currentChatContact.latestMind = mindData; // 直接挂载到当前角色的内存里
            } catch(e) {
                console.warn("解析 <mind> JSON 失败:", e);
            }
            return ''; 
        });

        rawText = rawText.replace(/<quote>([\s\S]*?)<\/quote>/is, (match, qContent) => {
            globalQuote = qContent.trim();
            return ''; 
        });

        rawText = rawText.replace(/<recall>([\s\S]*?)<\/recall>/is, (match, rContent) => {
            globalRecall = true;
            return rContent.trim(); 
        });

// 拦截 AI 自主更换头像动作
        rawText = rawText.replace(/<change_avatar>(\d+)<\/change_avatar>/gi, (match, idx) => {
            const imgIndex = parseInt(idx) - 1;
            // 找出最近发送的图片消息列表（按发送顺序）
            const recentImgMsgs = appData.chatData.messages
                .filter(m => m.chatId === currentChatContact.id && m.chatImage)
                .slice(-10); // 取最近10条图片消息
            if (recentImgMsgs[imgIndex]) {
                const chosenKey = recentImgMsgs[imgIndex].chatImage;
                const avatarKey = 'avatar_' + currentChatContact.id;
                const base64 = getRealImgSrc(chosenKey);
                // 保存为新头像
                idbHelper.saveImage(avatarKey, base64).catch(()=>{});
                appData.images[avatarKey] = base64;
                currentChatContact.avatar = avatarKey;
                saveData();
                // 刷新界面上的头像
                document.querySelectorAll(`[data-contact-id="${currentChatContact.id}"] img`).forEach(el => el.src = base64);
                const headerAva = document.getElementById('at-room-avatar');
                if(headerAva) headerAva.src = base64;
                showToast('Ta 换了你发的头像 ✨');
            }
            return ''; // 把标签从气泡里去掉
        });
        
// 拦截 AI 把图片放进 together 520 day 相框
        rawText = rawText.replace(/<save_to_frame\s*\/?>/gi, () => {
            const recentImgMsgs = appData.chatData.messages
                .filter(m => m.chatId === currentChatContact.id && m.chatImage)
                .slice(-5);
            const lastImg = recentImgMsgs[recentImgMsgs.length - 1];
            if (lastImg) {
                const base64 = getRealImgSrc(lastImg.chatImage);
                const frameKey = 'cp-img-rabbit_' + currentChatContact.id;
                
                // 🔥 核心修复：将 AI 选中的图片 ID 正确存入查阅手机专用的 desktopData.images 里，否则一返回就会消失！
                if (!currentChatContact.desktopData) currentChatContact.desktopData = { images: {}, texts: {} };
                if (!currentChatContact.desktopData.images) currentChatContact.desktopData.images = {};
                
                currentChatContact.desktopData.images[frameKey] = lastImg.chatImage;

                // 刷新相框显示
                const frameEl = document.getElementById('cp-img-rabbit');
                if(frameEl) frameEl.style.backgroundImage = `url('${base64}')`;
                saveData();
                showToast('Ta 把这张图放进了相框里 🖼️');
            }
            return '';
        });
        
        rawText = rawText.replace(/<status>(.*?)<\/status>/is, (match, st) => {
            const newStatus = st.trim();
            if(newStatus) {
                currentChatContact.currentStatus = newStatus; 
                document.getElementById('at-room-status').innerText = newStatus; 
            }
            return ''; 
        });

        // 2. 保护 HTML 模块
        let sandboxes =[];
        let safeText = rawText.replace(/<sandbox>([\s\S]*?)<\/sandbox>/gi, (match) => {
            sandboxes.push(match);
            return `__SBOX_${sandboxes.length - 1}__`;
        });

        // 3. 智能分段
        let parts = smartSplitText(safeText);
        if(parts.length > maxReply) parts = parts.slice(0, maxReply);
        if(parts.length === 0 && (globalQuote || sandboxes.length > 0)) parts = [""]; 

        for (let i = 0; i < parts.length; i++) {
            let partText = parts[i];
            const aiNow = Date.now() + i * 100; 
// 实时注入唯一的红包 ID
            partText = partText.replace(/__MSG_ID__/g, 'm_' + aiNow);
            // 还原 HTML
            let currentSandboxes =[];
            partText = partText.replace(/__SBOX_(\d+)__/g, (match, idx) => {
                currentSandboxes.push(sandboxes[idx]);
                return ''; 
            });

            // 提取表情包
            let stickerToSave = null;
            partText = partText.replace(/\[表情:\s*(.+?)\]/gi, (match, sDesc) => {
                sDesc = sDesc.trim();
                if (!stickerToSave) { 
                    appData.stickerVault.forEach(c => {
                        const s = c.stickers.find(x => x.desc === sDesc);
                        if(s) stickerToSave = { id: s.id, src: s.src, desc: s.desc };
                    });
                }
                return ''; 
            }).trim();

            if (currentSandboxes.length > 0) {
                partText += "\n" + currentSandboxes.join("\n");
            }

            let thisMsgQuote = (i === 0) ? globalQuote : null;

            // 防空气泡判定
            if (!partText && !stickerToSave && !thisMsgQuote && !globalRecall) {
                continue; 
            }

            if(i > 0) await new Promise(r => setTimeout(r, Math.min(partText.length * 50, 1500)));

            const aiMsg = { 
                id: 'm_' + aiNow, 
                chatId: currentChatContact.id, 
                sender: 'bot', 
                content: partText, 
                timestamp: aiNow,
                quote: thisMsgQuote,
                isRecalled: globalRecall,
                sticker: stickerToSave 
            };
            appData.chatData.messages.push(aiMsg);
            saveData(); // 存气泡的同时也会把 latestMind 一并存下来
            
            appendMsgToUI(aiMsg.id, 'bot', partText, aiNow, thisMsgQuote, globalRecall, stickerToSave);
        }
        // 👇👇👇 新增：后台消息接收通知逻辑 👇👇👇
        const chatPage = document.getElementById('page-chat-room');
        // 如果当前聊天室是隐藏的，说明你不在聊天界面
        if (!chatPage.classList.contains('visible')) {
            // 1. 弹出全局顶部通知
            showToast(`收到来自 ${currentChatContact.name} 的新消息`);
            try { if(navigator.vibrate) navigator.vibrate([100, 50, 100]); } catch(e){} // 手机震动提醒
            
            // 2. 给桌面的 Chat 图标加上未读红点
            const chatIcon = document.getElementById('icon-chat');
            if (chatIcon) {
                let badge = chatIcon.querySelector('.desktop-unread-badge');
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'desktop-unread-badge';
                    // 这是红点的样式，让它显示在右上角
                    badge.style.cssText = 'position:absolute; top:-5px; right:-5px; background:#FF3B30; color:#fff; font-size:10px; font-weight:bold; height:18px; min-width:18px; border-radius:9px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; z-index:20;';
                    chatIcon.appendChild(badge);
                }
                // 这里我们简单显示一个红点，不显示具体数字
                badge.innerText = '●';
                badge.style.padding = '0 5px';
            }
        }
        // 👆👆👆 新增代码结束 👆👆👆
    } catch (e) {
        console.error(e);
        alert("AI 请求出错: " + e.message); 
   } finally {
        dot.classList.remove('typing');
        status.innerText = currentChatContact.currentStatus || "在线";
        
        // 👇 核心植入：静默后台自动总结判定
        runSilentAutoSummary(currentChatContact.id);
    }
};

// ========================================================
// 绝对静默后台总结引擎 (不阻塞聊天，无感执行)
// ========================================================
async function runSilentAutoSummary(contactId) {
    const contact = appData.chatData.contacts.find(c => c.id === contactId);
    if(!contact || contact.autoSummary === false) return;
    
    const history = appData.chatData.messages.filter(m => m.chatId === contactId);
    if(contact.lastSummaryIndex === undefined) contact.lastSummaryIndex = 0;
    
    const interval = parseInt(contact.sumInterval) || 30;
    const unsummarizedMsgs = history.slice(contact.lastSummaryIndex);
    
    // 如果未总结的消息达到或超过设定的阈值
    if(unsummarizedMsgs.length >= interval) {
        console.log(`[静默总结启动] 已积累 ${unsummarizedMsgs.length} 条新消息...`);
        
        const defaultPrompt = `你现在需要以“${contact.name}”的第一人称，整理下面这段真实聊天记录中的长期记忆。

你的任务是提取未来继续聊天时真正有用的信息。

请重点记录：

1. 重要事实：
- 发生过的重要事件
- 已经明确确认的人物关系
- 重要约定
- 已经发生的共同经历

2. 人物信息：
- ${contact.name}自己的稳定性格、习惯、喜好或重要经历
- 用户明确表达过的稳定信息

3. 关系变化：
- 双方关系是否发生了明确变化
- 如果发生变化，说明具体原因
- 不要把一次玩笑、暧昧语气或短暂情绪自动总结成永久关系

4. 未完成事项：
- 约定之后要做的事情
- 正在进行的事情
- 用户或角色明确说过以后要继续的话题

5. 重要情绪：
- 只有具有持续意义的情绪变化才记录
- 不要把一时的开心、生气、害羞等写成永久性格

严格遵守：

- 只记录聊天中真实出现或能够明确推断的信息。
- 不要编造聊天中不存在的事实。
- 不要替用户增加没有说过的想法、感受或经历。
- 不要把${contact.name}的推测写成事实。
- 不要把“可能”“也许”“似乎”直接记成确定事实。
- 不要为了让故事更浪漫而修改事实。
- 不要刻意美化${contact.name}。
- 不要刻意贬低用户。
- User与${contact.name}都是独立的人。
- 记忆应该帮助未来保持连续性，而不是限制未来的合理变化。

请使用简洁的第一人称要点列表。`;
        const sumPrompt = contact.sumPrompt || defaultPrompt;
        
        let historyText = "";
        unsummarizedMsgs.forEach(m => historyText += `${m.sender === 'me' ? (appData.customTexts['display-name'] || 'User') : contact.name}: ${m.content}\n`);
        
        try {
            const model = appData.lastApi.model || "gpt-3.5-turbo";
            const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
                body: JSON.stringify({ model, messages:[ {role:"system", content: sumPrompt}, {role:"user", content: historyText} ], temperature: 0.3 })
            });
            const data = await res.json();
            if(data.error) throw new Error(data.error.message);
            
            const summary = data.choices[0].message.content;
            
            // 静默存入新记忆框
            if(!contact.memoryBlocks) contact.memoryBlocks =[];
            const newStart = contact.lastSummaryIndex + 1;
            const newEnd = contact.lastSummaryIndex + unsummarizedMsgs.length;
            contact.memoryBlocks.push(`[自动总结 ${newStart}-${newEnd}] ` + summary);
            
            // 更新游标，标记这些消息已经总结过了
            contact.lastSummaryIndex = newEnd;
            await saveData();
            console.log("[静默总结完成] 记忆区块已入库。");
        } catch (e) {
            console.error("[静默总结失败]", e);
            // 失败不更新游标，下次触发再试
        }
    }
}
// ==========================================
// ==========================================
// 魔法核心：AI 读心系统 (Mind Probe) - 伴随聊天瞬间同步版
// ==========================================

window.closeMindProbe = (e) => {
    if(e.target.id === 'modal-mind-probe') {
        document.getElementById('modal-mind-probe').classList.remove('show');
        document.getElementById('mind-scene').classList.remove('flipped');
    }
};

window.triggerMindProbe = async () => {
    if(!currentChatContact) return;

    // 1. 打开弹窗，恢复默认状态
    const modal = document.getElementById('modal-mind-probe');
    document.getElementById('mind-scene').classList.remove('flipped');
    
    // 隐藏加载动画，因为数据现在已经随着每次聊天同步保存在内存里了
    document.getElementById('mind-loading').style.display = 'none';
    
    document.getElementById('mind-avatar').src = getRealImgSrc(currentChatContact.avatar);
    document.getElementById('mind-name').innerText = currentChatContact.note || currentChatContact.name;
    
    modal.classList.add('show');

    // 2. 瞬间提取随着聊天生成的最新心声
    let mindData = currentChatContact.latestMind;

    // 兜底设计：如果刚建好角色还没发过一句话，给他一个“默认状态”
    if (!mindData) {
        mindData = {
            location: "📍 未知领域",
            exp_icon: "😶",
            exp_text: "面无表情",
            cloth_icon: "👔",
            cloth_text: "日常着装",
            act_icon: "🧍",
            act_text: "静静站立",
            mood_emoji: "💭",
            inner_voice: "<span class='mind-strikethrough'>没有任何想法...</span><br>多和对方聊聊天，心声面板就会自动同步最新状态啦。",
            stat_title: "同步率",
            stat_percent: 0
        };
    }

    // 3. 将数据直接填入 DOM
    document.getElementById('mind-location').innerText = mindData.location;
    document.getElementById('mind-exp-icon').innerText = mindData.exp_icon;
    document.getElementById('mind-exp-text').innerText = mindData.exp_text;
    document.getElementById('mind-cloth-icon').innerText = mindData.cloth_icon;
    document.getElementById('mind-cloth-text').innerText = mindData.cloth_text;
    document.getElementById('mind-act-icon').innerText = mindData.act_icon;
    document.getElementById('mind-act-text').innerText = mindData.act_text;
    
    // 背面数据 (日期时间还是取手机真实的当下时间更有沉浸感)
    const now = new Date();
    const days =['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    document.getElementById('mind-date').innerText = `${days[now.getDay()]} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    document.getElementById('mind-mood-emoji').innerText = mindData.mood_emoji;
    
    document.getElementById('mind-inner-voice').innerHTML = mindData.inner_voice;
    
    // 渲染进度条和不同颜色
    document.getElementById('mind-stat-title').innerText = mindData.stat_title;
    document.getElementById('mind-stat-bar').style.width = mindData.stat_percent + '%';
    document.getElementById('mind-stat-bar').style.background = mindData.stat_percent > 70 ? '#e76f51' : (mindData.stat_percent < 30 ? '#a1abc0' : '#2c3e50');
};

// ==========================================
// 9. 聊天室交互：长按、菜单、复制与删除 (Phase 1)
// ==========================================

let pressTimer = null;
let isDragging = false;
let currentActionMsgId = null; // 当前正在操作的消息ID

// 1. 监听聊天室的长按事件
// 1. 监听聊天室的长按事件 (修复版：支持 HTML 模块长按)
document.addEventListener("DOMContentLoaded", () => {
    const chatBody = document.getElementById('at-body');
    if(!chatBody) return;

    chatBody.addEventListener('touchstart', (e) => {
        // 修改点：不再只找 .msg-core，而是找整个消息容器 .at-msg
        // 这样无论你按在 文字气泡 上，还是按在 HTML模块 上，都能触发菜单
        const msgDiv = e.target.closest('.at-msg');
        
        // 如果点的是撤回提示，不触发
        if(!msgDiv || msgDiv.classList.contains('at-msg-recalled')) return; 
        
        isDragging = false;
        const msgId = msgDiv.getAttribute('data-id');
        
        // 设定 500ms 为长按
        pressTimer = window.setTimeout(() => {
            if(!isDragging) {
                // 触发震动反馈 (如果有)
                try { if(navigator.vibrate) navigator.vibrate(50); } catch(e){}
                openMsgActionModal(msgId);
            }
        }, 500); 
    });

    chatBody.addEventListener('touchmove', () => { 
        isDragging = true; 
        clearTimeout(pressTimer); 
    });

    chatBody.addEventListener('touchend', () => { 
        clearTimeout(pressTimer); 
    });
    
    // 兼容电脑端鼠标长按 (右键)
    chatBody.addEventListener('contextmenu', (e) => {
        const msgDiv = e.target.closest('.at-msg');
        if(msgDiv) {
            e.preventDefault(); // 阻止浏览器默认右键菜单
            const msgId = msgDiv.getAttribute('data-id');
            openMsgActionModal(msgId);
        }
    });
});


// 2. 打开操作菜单 (居中版)
window.openMsgActionModal = (msgId) => {
    currentActionMsgId = msgId;
    const msgData = appData.chatData.messages.find(m => m.id === msgId);
    if(!msgData) return;

    const grid = document.getElementById('msg-action-grid');
    grid.innerHTML = ''; 

    const isMe = msgData.sender === 'me';
    const createBtn = (icon, text, action, isDanger = false) => {
        return `<div class="msg-action-btn ${isDanger ? 'danger' : ''}" onclick="${action}"><div class="msg-action-icon"><i class="${icon}"></i></div><div class="msg-action-text">${text}</div></div>`;
    };

    let html = createBtn('ri-file-copy-line', '复制<br>Copy', 'copyTargetMsg()');
    html += createBtn('ri-reply-line', '引用<br>Quote', 'quoteTargetMsg()');
    
    // 只要没被撤回的消息，无论谁发的，你作为“上帝”都可以随意编辑！
    if(!msgData.isRecalled) {
        html += createBtn('ri-edit-2-line', '编辑<br>Edit', 'editTargetMsg()');
    }
    
    if(isMe) {
        if(!msgData.isRecalled) html += createBtn('ri-arrow-go-back-line', '撤回<br>Recall', 'recallTargetMsg(true)');
    } else {
        const aiMsgs = appData.chatData.messages.filter(m => m.chatId === currentChatContact.id && m.sender === 'bot');
        const isLastAi = aiMsgs.length > 0 && aiMsgs[aiMsgs.length - 1].id === msgId;
        if(isLastAi && !msgData.isRecalled) html += createBtn('ri-refresh-line', '重回<br>Regen', 'regenLastAiMsg()');
        else if(!msgData.isRecalled) html += createBtn('ri-eye-off-line', 'AI撤回<br>Simulate', 'recallTargetMsg(false)');
    }

    // 新增：如果这个气泡上有贴纸，显示“撕下贴纸”按钮
    if (msgData.peeledStickers && msgData.peeledStickers.length > 0) {
        html += createBtn('ri-sticky-note-line', '撕下贴纸<br>Unpeel', 'clearMsgStickers()', true);
    }

    html += createBtn('ri-list-check-2', '多选<br>Select', 'toggleMultiSelect()');
    html += createBtn('ri-delete-bin-line', '删除<br>Delete', 'deleteTargetMsg()', true);

    grid.innerHTML = html;
    document.getElementById('modal-msg-action').classList.add('show');
};

window.closeMsgActionModal = () => {
    document.getElementById('modal-msg-action').classList.remove('show');
    // 修复：不要在这里清空 currentActionMsgId，否则会导致编辑保存时丢失目标！
};

window.clearMsgStickers = async () => {
    if(!currentActionMsgId) return;
    const msgData = appData.chatData.messages.find(m => m.id === currentActionMsgId);
    if(msgData) {
        msgData.peeledStickers = []; // 清空数据库里的贴纸
        await saveData();
        
        // 清除画面上的贴纸
        const msgBubble = document.querySelector(`.at-msg[data-id="${currentActionMsgId}"]`);
        if(msgBubble) {
            msgBubble.querySelectorAll('.peeled-sticker').forEach(el => el.remove());
        }
        showToast('贴纸已撕下');
    }
    closeMsgActionModal();
};

window.saveEditedMsg = () => {
    let newText = document.getElementById('edit-msg-input').value.trim();
    if(!currentActionMsgId) return;
    
    const msgData = appData.chatData.messages.find(m => m.id === currentActionMsgId);
    if(msgData) {
        // 重新通过“中文描述”解析文本框里的表情包指令
        let newSticker = null;
        newText = newText.replace(/\[表情:\s*(.+?)\]/gi, (match, sDesc) => {
            sDesc = sDesc.trim();
            if (!newSticker) {
                appData.stickerVault.forEach(c => {
                    const s = c.stickers.find(x => x.desc === sDesc);
                    if(s) newSticker = { id: s.id, src: s.src, desc: s.desc };
                });
            }
            return '';
        }).trim();

        if (!newText && !newSticker && !msgData.quote) {
            alert("消息不能为空！(Message cannot be empty)"); return;
        }

        // 保存新的内容和可能变化了的表情包
        msgData.content = newText;
        msgData.sticker = newSticker;
        saveData(); 
        
        // 通过无缝重新加载聊天室的方式，完美重绘文字、表情和气泡框
        const oldScroll = document.getElementById('at-body').scrollTop;
        openChatRoom(currentChatContact.id);
        setTimeout(() => document.getElementById('at-body').scrollTop = oldScroll, 50);
    }
    
    document.getElementById('modal-msg-edit').classList.remove('show');
    showToast("已修改 (Edited)");
};

// 3. 实现功能：复制
window.copyTargetMsg = () => {
    if(!currentActionMsgId) return;
    const msgData = appData.chatData.messages.find(m => m.id === currentActionMsgId);
    if(msgData) {
        navigator.clipboard.writeText(msgData.content).then(() => {
            closeMsgActionModal();
            showToast('已复制 (Copied)');
        });
    }
};

// 4. 实现功能：删除单条
window.deleteTargetMsg = () => {
    if(!currentActionMsgId) return;
    if(confirm('确定要删除这条消息吗？(Delete this message?)')) {
        // 1. 从内存数据库中删掉
        appData.chatData.messages = appData.chatData.messages.filter(m => m.id !== currentActionMsgId);
        saveData();
        
        // 2. 从界面上物理移除，带点动画过渡
        const msgDiv = document.querySelector(`.at-msg[data-id="${currentActionMsgId}"]`);
        if(msgDiv) {
            msgDiv.style.opacity = '0';
            msgDiv.style.transform = 'scale(0.9)';
            setTimeout(() => msgDiv.remove(), 200);
        }
        
        closeMsgActionModal();
    }
};

// ==========================================
// Phase 2: 引用 (Quote) 与 编辑 (Edit)
// ==========================================
let currentQuoteMsg = null; // 当前正在引用的消息记录

// --- 引用功能 ---
window.quoteTargetMsg = () => {
    if(!currentActionMsgId) return;
    const msgData = appData.chatData.messages.find(m => m.id === currentActionMsgId);
    if(msgData) {
        currentQuoteMsg = msgData;
        const author = msgData.sender === 'me' ? (appData.customTexts['display-name'] || '我') : currentChatContact.name;
        document.getElementById('quote-preview-text').innerText = `${author}: ${msgData.content}`;
        document.getElementById('quote-preview-bar').style.display = 'flex';
        document.getElementById('inp-txt').focus();
    }
    closeMsgActionModal();
};

window.cancelQuote = () => {
    currentQuoteMsg = null;
    document.getElementById('quote-preview-bar').style.display = 'none';
};


// 5. 实现功能：重回 (Regenerate Whole AI Round)
window.regenLastAiMsg = () => {
    if(!currentActionMsgId) return;
    
    // 获取当前聊天的所有消息
    const roomMsgs = appData.chatData.messages.filter(m => m.chatId === currentChatContact.id);
    if (roomMsgs.length === 0) return;
    
    // 核心逻辑：从最后一条开始往前找，找出所有连续的 AI 消息（即最新的一轮）
    let idsToDelete =[];
    for (let i = roomMsgs.length - 1; i >= 0; i--) {
        if (roomMsgs[i].sender === 'bot') {
            idsToDelete.push(roomMsgs[i].id);
        } else {
            break; // 碰到我发的消息就停止，说明这一轮结束了
        }
    }
    
    if (idsToDelete.length > 0) {
        // 1. 从数据库中批量删除这一轮的 AI 消息
        appData.chatData.messages = appData.chatData.messages.filter(m => !idsToDelete.includes(m.id));
        saveData();
        
        // 2. 从界面上物理移除这些气泡
        idsToDelete.forEach(id => {
            const div = document.querySelector(`[data-id="${id}"]`);
            if(div) div.remove();
        });
        
        // 3. 关闭菜单
        closeMsgActionModal();
        
        // 4. 重新召唤 AI 思考并生成新回复
        triggerAtelierAI();
    }
};


// ==========================================
// 独家定制：表情包管理中心 (Sticker Vault)
// ==========================================
let currentMgrCatId = null;
let addStkMode = 'stk'; // 'stk' 或 'cat'

// 1. 在表情键盘处添加入口（这里我们为了方便，把它绑在一个新的函数里，稍后我们在 UI 上加按钮）


// 2. 渲染管理中心
window.renderStickerManager = () => {
    const catListEl = document.getElementById('mgr-cat-list');
    const gridEl = document.getElementById('mgr-sticker-grid');
    
    
    catListEl.innerHTML = '';
    appData.stickerVault.forEach(cat => {
        const div = document.createElement('div');
        div.className = `sticker-cat-item ${cat.id === currentMgrCatId ? 'active' : ''}`;
        div.innerText = cat.name;
        div.onclick = () => { currentMgrCatId = cat.id; renderStickerManager(); };
        catListEl.appendChild(div);
    });

    const currentCat = appData.stickerVault.find(c => c.id === currentMgrCatId);
    if(!currentCat) return;

    document.getElementById('mgr-cat-name').value = currentCat.name;
    
const assignContainer = document.getElementById('mgr-cat-assign-container');
    
    // 生成多选复选框
    let html = `<label style="display:flex; align-items:center; gap:6px; margin-bottom:6px;"><input type="checkbox" value="all" ${currentCat.linkedChars.includes('all') ? 'checked' : ''} onchange="saveCurrentCatInfo()"> 🌐 全局通用 (所有角色都可以用)</label>`;
    
    if(appData.chatData.contacts) {
        appData.chatData.contacts.forEach(c => {
            const isChecked = currentCat.linkedChars.includes(c.id) ? 'checked' : '';
            html += `<label style="display:flex; align-items:center; gap:6px; margin-bottom:6px;"><input type="checkbox" value="${c.id}" ${isChecked} onchange="saveCurrentCatInfo()"> 👤 ${c.name}</label>`;
        });
    }
    assignContainer.innerHTML = html;
    // 设置 AI 可用开关
    const aiTgl = document.getElementById('mgr-cat-ai-use');
    if (currentCat.aiCanUse) aiTgl.classList.add('on');
    else aiTgl.classList.remove('on');

    gridEl.innerHTML = '';
    if(!currentCat.stickers || currentCat.stickers.length === 0) {
        gridEl.innerHTML = '<div style="grid-column: span 3; text-align:center; color:#ccc; font-size:12px; padding:20px 0;">此分类下还没表情，点击右上角 + 号添加</div>';
        return;
    }
    currentCat.stickers.forEach(stk => {
        const box = document.createElement('div');
        box.className = 'sticker-item-box';
        // 👇 这里修改了底部的描述部分，加上了点击事件和蓝色的小铅笔图标
        box.innerHTML = `
            <div class="sticker-del-btn" onclick="deleteSticker('${stk.id}')"><i class="ri-close-line"></i></div>
            <img src="${getRealImgSrc(stk.src)}">
            <div class="sticker-item-desc" title="点击修改描述" onclick="editStickerDesc('${stk.id}')" style="cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${stk.desc || '无描述'}</span>
                <i class="ri-edit-2-line" style="color: #007AFF; font-size: 13px; flex-shrink: 0;"></i>
            </div>
        `;
        gridEl.appendChild(box);
    });
};

window.saveCurrentCatInfo = async () => {
    const currentCat = appData.stickerVault.find(c => c.id === currentMgrCatId);
    if(currentCat) {
        currentCat.name = document.getElementById('mgr-cat-name').value.trim() || '未命名分类';
        
        // 抓取所有勾选的复选框
        const checkedBoxes = document.querySelectorAll('#mgr-cat-assign-container input[type="checkbox"]:checked');
        currentCat.linkedChars = Array.from(checkedBoxes).map(cb => cb.value);
        if(currentCat.linkedChars.length === 0) currentCat.linkedChars = ['all']; // 兜底防止全空
        
        currentCat.aiCanUse = document.getElementById('mgr-cat-ai-use').classList.contains('on');
        await saveData();
        renderStickerManager();
    }
};

window.deleteCurrentCat = async () => {
    if(appData.stickerVault.length <= 1) { alert('至少保留一个分类哦！'); return; }
    if(confirm('确定要删除整个分类及里面的所有表情吗？')) {
        appData.stickerVault = appData.stickerVault.filter(c => c.id !== currentMgrCatId);
        currentMgrCatId = appData.stickerVault[0].id;
        await saveData();
        renderStickerManager();
    }
};

window.deleteSticker = async (stkId) => {
    if(confirm('删除这个表情？')) {
        const currentCat = appData.stickerVault.find(c => c.id === currentMgrCatId);
        if(currentCat) {
            currentCat.stickers = currentCat.stickers.filter(s => s.id !== stkId);
            await saveData();
            renderStickerManager();
        }
    }
};

// 专属功能：修改表情包描述
window.editStickerDesc = async (stkId) => {
    // 找到当前所在的分类
    const currentCat = appData.stickerVault.find(c => c.id === currentMgrCatId);
    if (!currentCat) return;
    
    // 找到你点击的那个表情包
    const stk = currentCat.stickers.find(s => s.id === stkId);
    if (!stk) return;

    // 弹窗让用户输入新描述，默认填入旧的描述
    const newDesc = prompt('请输入新的表情包描述（给 AI 看的指令）：', stk.desc);
    
    // 如果用户点击了确定，且输入内容不为空
    if (newDesc !== null) {
        const trimmedDesc = newDesc.trim();
        if (!trimmedDesc) {
            alert('描述不能为空哦！');
            return;
        }
        
        // 更新数据并保存
        stk.desc = trimmedDesc;
        await saveData();
        
        // 重新渲染面板，让你立刻看到变化
        renderStickerManager(); 
        showToast('描述已更新！');
    }
};
window.openAddStickerModal = () => {
    document.getElementById('new-stk-preview').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f9f9f9' rx='10' ry='10'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='14' fill='%23ccc' text-anchor='middle' dy='.3em'%3EImage%3C/text%3E%3C/svg%3E";
    document.getElementById('new-stk-preview').removeAttribute('data-base64');
    document.getElementById('new-stk-url').value = '';
    document.getElementById('new-stk-desc').value = '';
    document.getElementById('new-batch-text').value = '';
    document.getElementById('new-cat-name').value = '';
    switchAddStkTab('stk');
    document.getElementById('modal-sticker-add').classList.add('show');
};

window.switchAddStkTab = (mode) => {
    addStkMode = mode;
    document.getElementById('area-add-stk').style.display = mode === 'stk' ? 'block' : 'none';
    document.getElementById('area-add-batch').style.display = mode === 'batch' ? 'block' : 'none';
    document.getElementById('area-add-cat').style.display = mode === 'cat' ? 'block' : 'none';
    
    document.getElementById('tab-add-stk').className = mode === 'stk' ? 'btn-std' : 'btn-std btn-sec';
    document.getElementById('tab-add-batch').className = mode === 'batch' ? 'btn-std' : 'btn-std btn-sec';
    document.getElementById('tab-add-cat').className = mode === 'cat' ? 'btn-std' : 'btn-std btn-sec';
};

window.confirmAddStickerOrCat = async () => {
    const currentCat = appData.stickerVault.find(c => c.id === currentMgrCatId);

    if(addStkMode === 'cat') {
        const name = document.getElementById('new-cat-name').value.trim();
        if(!name) { alert('输入个名字吧'); return; }
        // 默认新建分类：AI 默认不可用
        const newCat = { id: 'cat_' + Date.now(), name: name, linkedChars:['all'], stickers:[], aiCanUse: false };
        appData.stickerVault.push(newCat);
        currentMgrCatId = newCat.id; 
    } 
    else if (addStkMode === 'batch') {
        if(!currentCat) return;
        const text = document.getElementById('new-batch-text').value.trim();
        const lines = text.split('\n');
        let addedCount = 0;
        
        lines.forEach(line => {
            // 兼容中文冒号和英文冒号
            const firstColonIdx = line.search(/[:：]/);
            if (firstColonIdx !== -1) {
                const desc = line.substring(0, firstColonIdx).trim();
                const url = line.substring(firstColonIdx + 1).trim();
                if (desc && url) {
                    currentCat.stickers.push({
                        id: 'stk_' + Date.now() + Math.floor(Math.random()*1000),
                        src: url,
                        desc: desc
                    });
                    addedCount++;
                }
            }
        });
        
        if(addedCount === 0) {
            alert('没有识别到有效格式。请严格按照 "描述文本:网址" 的格式，一行一个输入。');
            return;
        }
    } 
    else {
        if(!currentCat) return;
        const desc = document.getElementById('new-stk-desc').value.trim();
        const base64 = document.getElementById('new-stk-preview').getAttribute('data-base64');
        const urlVal = document.getElementById('new-stk-url').value.trim();
        
        if(!desc) { alert('请给表情写一段文字描述！'); return; }
        if(!base64 && !urlVal) { alert('请上传图片或输入链接'); return; }

        let finalSrc = urlVal;
        const stkId = 'stk_' + Date.now();
        if(base64) {
            finalSrc = 'img_' + stkId;
            try { await idbHelper.saveImage(finalSrc, base64); } catch(e){}
            appData.images[finalSrc] = base64;
        }
        currentCat.stickers.push({ id: stkId, src: finalSrc, desc: desc });
    }

    await saveData();
    document.getElementById('modal-sticker-add').classList.remove('show');
    renderStickerManager();
    showToast();
};

// 5. 聊天室：渲染表情面板 Tab 和 内容
// 1. 在表情键盘处添加入口
window.openStickerManager = () => {
    // 【关键修复：清除旧版本冲突数据，强制格式化为数组】
    if(!appData.stickerVault || !Array.isArray(appData.stickerVault) || appData.stickerVault.length === 0) {
        appData.stickerVault =[{ id: 'cat_default', name: '默认分类', linkedChars: ['all'], stickers:[] }];
        saveData(); // 将修复后的数据存入你的浏览器
    }
    currentMgrCatId = appData.stickerVault[0].id;
    renderStickerManager();
    document.getElementById('page-sticker-mgr').classList.add('open');
    document.getElementById('emoji-picker').classList.remove('show'); // 关闭原生emoji
};


// 5. 聊天室：渲染表情面板 Tab 和 内容
window.renderChatStickerPanel = () => {
    const tabsEl = document.getElementById('chat-sticker-tabs');
    tabsEl.innerHTML = '';

    // 【关键修复：进聊天室时也进行一次数据安全检查】
    if(!appData.stickerVault || !Array.isArray(appData.stickerVault)) {
        appData.stickerVault =[{ id: 'cat_default', name: '默认分类', linkedChars: ['all'], stickers:[] }];
        saveData();
    }

    // 默认的 Emoji Tab
    const emojiTab = document.createElement('span');
    emojiTab.innerHTML = '😀 Emoji';
    emojiTab.style.cursor = 'pointer';
    emojiTab.style.color = '#111'; // 默认高亮
    emojiTab.onclick = (e) => { 
        Array.from(tabsEl.children).forEach(el => el.style.color = '#888');
        e.target.style.color = '#111';
        renderChatStickerGrid('emoji'); 
    };
    tabsEl.appendChild(emojiTab);

    // 动态渲染当前角色有权限的分类 Tab
    const validCats = appData.stickerVault;
    validCats.forEach((cat) => {
        const tab = document.createElement('span');
        tab.innerText = cat.name;
        tab.style.cursor = 'pointer';
        tab.onclick = (e) => { 
            Array.from(tabsEl.children).forEach(el => el.style.color = '#888');
            e.target.style.color = '#111';
            renderChatStickerGrid('cat', cat.id); 
        };
        tabsEl.appendChild(tab);
    });

    // 事件委托：用 3 个监听器代替每个 emoji/贴纸各自的 bindLongPress（原来约 1200 个）
    const gridEl = document.getElementById('chat-sticker-grid');
    // 先移除旧监听（通过克隆节点的方式最保险，避免重复进入聊天室时叠加）
    const newGridEl = gridEl.cloneNode(false);
    gridEl.parentNode.replaceChild(newGridEl, gridEl);

    let _lpTimer = null;

    newGridEl.addEventListener('touchstart', (e) => {
        const emojiEl = e.target.closest('.emoji-item');
        const stkEl   = e.target.closest('.chat-picker-stk-box');
        const target  = emojiEl || stkEl;
        if (!target) return;

        const content = emojiEl ? target.innerText.trim() : target.dataset.stickerSrc;
        const type    = emojiEl ? 'emoji' : 'img';

        _lpTimer = setTimeout(() => {
            dragItem = { content, type };
            document.getElementById('emoji-picker').classList.remove('show');
            const touch = e.touches[0];
            ghostEl.style.display = 'block';
            ghostEl.style.left = touch.clientX + 'px';
            ghostEl.style.top  = touch.clientY + 'px';
            ghostEl.innerHTML  = type === 'emoji'
                ? `<div style="font-size:40px;">${content}</div>`
                : `<img src="${getRealImgSrc(content)}" style="width:60px;">`;
            try { if (navigator.vibrate) navigator.vibrate(20); } catch(err) {}
        }, 300);
    }, { passive: true });

    newGridEl.addEventListener('touchend', () => clearTimeout(_lpTimer), { passive: true });
    newGridEl.addEventListener('touchmove', () => { if (!dragItem) clearTimeout(_lpTimer); }, { passive: true });

    // 初始化时加载 Emoji
    renderChatStickerGrid('emoji');
};

window.renderChatStickerGrid = (type, catId = null) => {
    const gridEl = document.getElementById('chat-sticker-grid');
    gridEl.innerHTML = '';
    
    if(type === 'emoji') {
        const emojis = [
            '😀','😃','😄','😁','😆','😅','😂','🤣','🥲','🥹','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😶‍🌫️','😱','😨','😰','😥','😓','🤗','🤔','🫣','🤭','🫡','🤫','🫠','🤥','😶','🫥','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','😵‍💫','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠',
            '😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾','🫶','👐','🙌','👏','🤝','👍','👎','👊','✊','🤛','🤜','🤞','✌️','🫰','🤟','🤘','👌','🤌','🤏','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤙','🫲','🫳','💪','🦾','🖕','✍️','🙏','🫵','🦶','🦵','🦿','💄','💋','👄','🫦','🦷','👅','👂','🦻','👃','👣','👁️','👀','🫀','🫁','🧠','🗣️','👤','👥','🫂',
            '💘','💝','💖','💗','💓','💞','💕','💟','❣️','💔','❤️','🧡','💛','💚','💙','💜','🤎','🖤','🩶','🤍','💋','💯','💢','💥','💫','💦','💨','🕳️','💣','💬','👁️‍🗨️','🗨️','🗯️','💭','💤','👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄','🫦',
            '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🕸️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🦭','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','RAM','🐑','🐑','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🪿','🦩','🕊️','🐇','🦝','🦨','🦡','🦦','🦫','🦦','🐁','🐀','🐿️','🦔','🐉','🐲','🌵','🎄','🌲','🌳','🌴','🪵','🌱','🌿','☘️','🍀','🎍','🪴','🎋','🍃','🍂','🍁','🍄','🌾','🪸','🪸','🐚','🪨','🥀','🌺','🌻','🌹','🌷','🪷','🌸','💐','🪻','🌼','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌎','🌍','🌏','🪐','💫','⭐️','🌟','✨','⚡️','☄️','💥','🔥','🌪️','🌈','☀️','🌤️','⛅️','🌥️','☁️','🌦️','🌧️','⛈️','🌩️','🌨️','❄️','☃️','⛄️','🌬️','💨','💧','💦','🫧','☔️','☂️','🌊','🌫️'
        ];
        
        emojis.forEach(em => {
            const div = document.createElement('div');
            div.className = 'emoji-item';
            div.innerText = em;
            div.onclick = () => insertEmoji(em);
            // 长按拖拽由父容器的事件委托处理，无需单独绑定
            gridEl.appendChild(div);
        });
    } else {
        const cat = appData.stickerVault.find(c => c.id === catId);
        if(cat && cat.stickers) {
            cat.stickers.forEach(stk => {
                const box = document.createElement('div');
                box.className = 'chat-picker-stk-box';
                box.dataset.stickerSrc = stk.src; // 供事件委托长按拖拽读取
                box.onclick = () => sendStickerMsg(stk.id);
                box.innerHTML = `
                    <img src="${getRealImgSrc(stk.src)}" class="chat-picker-stk-img">
                    <div class="chat-picker-stk-desc" title="${stk.desc}">${stk.desc || '无描述'}</div>
                `;
                // 长按拖拽由父容器的事件委托处理，无需单独绑定
                gridEl.appendChild(box);
            });
        }
    }
};


