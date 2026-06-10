// ==================== 会议数据与任务库 ====================

// 上周周会（W23）的完整会议纪要数据
const meetingMinutes = {
  week: "W23",
  dateRange: "2026.6.1-6.7",
  meetingDate: "2026-06-04",
  location: "Teams线上会议",
  host: "吴忠明",
  attendees: "徐斌；关雪丹；梁志强；张海龙；李燏；刘金山；何锦仪",
  classification: "内部公开",
  
  topics: [
    {
      id: 1,
      number: 1,
      badge: "📌 议题一：上周任务闭环回顾",
      title: "工时填报规则统一",
      description: "• 电气组工时排名第二但未达100%\n• 存在员工休假填错、规则不清晰等问题\n• 需统一能源侧与动力侧填报规则，形成文档发群",
      owner: "关雪丹、刘金山",
      deadline: "下周前",
      status: "🟡 进行中"
    },
    {
      id: 2,
      number: 2,
      badge: "📌 议题一：上周任务闭环回顾",
      title: "海目星装配段监造策略制定",
      description: "• 避免最后阶段被动，需输出远程+现场联合监造方案",
      owner: "张海龙、吴忠明",
      deadline: "本周",
      status: "🟡 进行中"
    },
    {
      id: 3,
      number: 3,
      badge: "👥 议题二：组织人才 - 招聘工作",
      title: "招聘工作与编制对齐",
      description: "• 正式编制（非考勤）共7个指标；考勤制统一招5人（建议3人欧姆龙+2人西门子）\n• 吴忠明：需求3人，2人待入职，2人三面中\n• 关雪丹：2人已发offer\n• 张海龙：物流需求3人，1人三面中，2人一面待定\n• 面试分工：西门子（关雪丹/张海龙）、欧姆龙（梁志强/吴忠明）",
      owner: "各团队负责人",
      deadline: "持续跟进",
      status: "🟡 进行中"
    },
    {
      id: 4,
      number: 4,
      badge: "👥 议题二：组织人才 - 离职情况",
      title: "离职情况分析与员工沟通",
      description: "• 近期离职原因：出差多、工作压力大\n• B+及以上员工离职需重点分析原因\n• 需加强员工沟通，向团队传达出差是行业常态但非长期",
      owner: "各团队负责人",
      deadline: "持续跟进",
      status: "🟡 进行中"
    },
    {
      id: 5,
      number: 5,
      badge: "👥 议题二：组织人才 - 培训与述职",
      title: "技术培训与述职安排",
      description: "• 上半年未组织技术培训，需各组重视\n• 述职时间定于7月15日以后（通电节点后）",
      owner: "各团队负责人",
      deadline: "7月中旬",
      status: "⚪ 待开始"
    },
    {
      id: 6,
      number: 6,
      badge: "👥 议题二：组织人才 - 文化建设",
      title: "文化精神传达",
      description: "• 自研不是目的，掌握技术标准、构建能力护城河才是核心\n• 运维总成本（Total Cost）优先于单纯硬件采购成本",
      owner: "各团队负责人",
      deadline: "持续",
      status: "🟡 进行中"
    },
    {
      id: 7,
      number: 7,
      badge: "🔐 议题三：机制流程/信息安全",
      title: "信息安全外审",
      description: "• 本月进行外审，需各组配合提供证据",
      owner: "关雪丹",
      deadline: "本月",
      status: "🟡 进行中"
    },
    {
      id: 8,
      number: 8,
      badge: "🔐 议题三：机制流程/质量合规",
      title: "工时填报流程规范文档",
      description: "• 需输出标准化SOP并在群内发布",
      owner: "关雪丹、刘金山",
      deadline: "下周前",
      status: "🟡 进行中"
    },
    {
      id: 9,
      number: 9,
      badge: "🔐 议题三：机制流程/质量合规",
      title: "电气监造流程写入开发流程",
      description: "• 将监造要求纳入电气开发流程，升版文件",
      owner: "关雪丹",
      deadline: "跟进",
      status: "🟡 进行中"
    },
    {
      id: 10,
      number: 10,
      badge: "🏭 议题四：具体业务 - 已有项目",
      title: "宜昌项目风险与气源问题",
      description: "• 气源不足是主要卡点，电机选型拆装问题需确认责任归属\n• 关雪丹下周赴宜昌现场协调",
      owner: "关雪丹、吴忠明",
      deadline: "下周",
      status: "🟡 进行中"
    },
    {
      id: 11,
      number: 11,
      badge: "🏭 议题四：具体业务 - 已有项目",
      title: "沧州二项目",
      description: "• 装配段（海目星）延期风险需制定监造策略\n• 烘烤段（大成）西门子能力不足风险，需复盘KT打分\n• 立库技术争议已解决",
      owner: "张海龙、吴忠明",
      deadline: "持续跟进",
      status: "🟡 进行中"
    },
    {
      id: 12,
      number: 12,
      badge: "🏭 议题四：具体业务 - 已有项目",
      title: "沧州三项目",
      description: "• 项目暂停，预计8月重启",
      owner: "张海龙",
      deadline: "预计8月",
      status: "⚪ 待开始"
    },
    {
      id: 13,
      number: 13,
      badge: "🏭 议题四：具体业务 - 已有项目",
      title: "全球量产（美国/英国/日本）",
      description: "• 英国需西门子/SEW资源支持\n• 美国SMY项目需梳理3条线角色定位（关雪丹&刘金山6月底前完成）",
      owner: "梁志强、关雪丹",
      deadline: "持续跟进",
      status: "🟡 进行中"
    },
    {
      id: 14,
      number: 14,
      badge: "🏭 议题四：具体业务 - 已有项目",
      title: "西班牙项目（CRA认证）",
      description: "• CRA认证成本评估完成，硬件成本基本不增\n• 6月底输出专题报告",
      owner: "李燏",
      deadline: "6月底",
      status: "🟡 进行中"
    },
    {
      id: 15,
      number: 15,
      badge: "🏭 议题四：具体业务 - 新项目分析",
      title: "美国SMY模组线角色定位",
      description: "• 三条线角色未明确，需拉通确认",
      owner: "关雪丹、刘金山",
      deadline: "6月底前",
      status: "🟡 进行中"
    },
    {
      id: 16,
      number: 16,
      badge: "🤝 议题五：共同决策",
      title: "业务资源分配模式",
      description: "• 正式员工优先 → 艾德玛承接 → 外部临时外包 → 业务切割",
      owner: "各团队负责人",
      deadline: "即日起执行",
      status: "✅ 已决策"
    },
    {
      id: 17,
      number: 17,
      badge: "🤝 议题五：共同决策",
      title: "PDT考核对齐要求",
      description: "• 需求清晰、变更管控、快速决策、年度规划、能力锁定、插单规则",
      owner: "部门",
      deadline: "已共识",
      status: "✅ 已决策"
    },
    {
      id: 18,
      number: 18,
      badge: "📌 议题六：其他",
      title: "周会流程优化（模板升级）",
      description: "需改动项：\n1. 模板增加\"实际完成情况\"列，逐项核对上周任务是否按时达标\n2. 增加周次标识（如W23）\n3. 建立会前议题收集机制，周三前各负责人填写，会上快速过项\n4. 决议/待办强制关联责任人和截止时间",
      owner: "何锦仪",
      deadline: "下周前",
      status: "🟡 进行中"
    }
  ],

  decisions: [
    "工时填报规则需形成文档，由 关雪丹、刘金山 于下周前完成并群内发布",
    "各团队负责人需对齐编制数据，按最终版执行招聘计划",
    "海目星装配段需制定监造策略（张海龙、吴忠明 负责）",
    "美国SMY项目三条线角色定位由 关雪丹、刘金山 负责梳理",
    "业务资源分配模式按\"正式员工优先 → 艾德玛承接 → 外部外包 → 业务切割\"执行",
    "述职时间定于7月15日以后",
    "周会模板由 何锦仪 优化：增加实际完成列、周次标识、会前收集机制"
  ],

  actionPlan: [
    { id: 1, action: "输出工时填报规则文档并在群内发布", owner: "关雪丹、刘金山", deadline: "下周" },
    { id: 2, action: "优化周会模板（增加实际完成列、周次标识、会前收集机制）", owner: "何锦仪", deadline: "下周会前" },
    { id: 3, action: "赴宜昌现场考察，协调气源问题", owner: "关雪丹", deadline: "下周" },
    { id: 4, action: "制定海目星装配段监造策略", owner: "张海龙、吴忠明", deadline: "本周" },
    { id: 5, action: "梳理美国SMY项目三条线角色定位", owner: "关雪丹、刘金山", deadline: "6月底前" },
    { id: 6, action: "输出CRA认证专题报告", owner: "李燏", deadline: "6月底" },
    { id: 7, action: "完成大成烤箱KT打分复盘", owner: "张海龙", deadline: "跟进" },
    { id: 8, action: "将监造要求写入电气开发流程", owner: "关雪丹", deadline: "跟进" }
  ],

  risks: [
    { risk: "宜昌厂房气源长期不足", impact: "调试延期", level: "🔴 高", mitigation: "关雪丹下周现场协调" },
    { risk: "海目星装配段监造缺失", impact: "沧州二交付", level: "🔴 高", mitigation: "张海龙/吴忠明制定监造策略" },
    { risk: "美国SMY项目角色模糊", impact: "人力冲突", level: "🟡 中", mitigation: "关雪丹&刘金山6月底前梳理" }
  ]
};

// ==================== 任务库 - 仅来源于上周周会「下一步行动计划」 ====================
// 提出周次统一为 W23，预计完成时间根据行动计划中的描述填写
const taskLibrary = {
  "关雪丹": [
    { task: "输出工时填报规则文档并在群内发布", proposeWeek: "W23", deadline: "下周" },
    { task: "梳理美国SMY项目三条线角色定位", proposeWeek: "W23", deadline: "6月底前" }
  ],
  "吴忠明": [
    { task: "制定海目星装配段监造策略", proposeWeek: "W23", deadline: "本周" }
  ],
  "张海龙": [
    { task: "制定海目星装配段监造策略", proposeWeek: "W23", deadline: "本周" },
    { task: "完成大成烤箱KT打分复盘", proposeWeek: "W23", deadline: "跟进" }
  ],
  "梁志强": [],
  "刘金山": [
    { task: "输出工时填报规则文档并在群内发���", proposeWeek: "W23", deadline: "下周" },
    { task: "梳理美国SMY项目三条线角色定位", proposeWeek: "W23", deadline: "6月底前" }
  ],
  "李燏": [
    { task: "输出CRA认证专题报告", proposeWeek: "W23", deadline: "6月底" }
  ],
  "何锦仪": [
    { task: "优化周会模板（增加实际完成列、周次标识、会前收集机制）", proposeWeek: "W23", deadline: "下周会前" }
  ]
};
