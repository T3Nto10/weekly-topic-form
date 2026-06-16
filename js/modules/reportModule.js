// ==================== 文本报告生成模块 ====================

/**
 * 生成完整的汇报文本
 * @returns {string} 格式化的汇报文本
 */
function generateTextReport() {
    let filler = document.getElementById('fillerName').value || '未填写';
    let week = document.getElementById('fillWeek').value || getCurrentWeekRangeText();
    let now = new Date().toLocaleString('zh-CN');
    
    let sections = [];
    
    // 议题一：上周任务闭环回顾
    let tasks = getTbodyDataForText('taskTbody', false);
    if (tasks.length > 0) {
        let content = [];
        tasks.forEach((task, idx) => {
            content.push(`${idx + 1}. 任务：${task[0] || '—'}`);
            content.push(`   提出周次：${task[1] || '—'} | 预计完成：${task[2] || '—'}`);
            content.push(`   完成情况：${task[3] || '—'}`);
            content.push(`   情况说明：${task[4] || '—'}`);
            content.push(`   负责人：${task[5] || '—'}`);
        });
        sections.push({
            title: '议题一 上周任务闭环回顾',
            lines: content
        });
    }
    
    // 议题二：组织人才与能力建设
    let orgData = getDynamicDataForText('orgTablesContainer');
    if (orgData.length > 0) {
        let content = [];
        orgData.forEach(cat => {
            content.push(`${cat.category}`);
            cat.rows.forEach(row => {
                let filtered = row.filter(v => v && v !== '');
                if (filtered.length > 0) {
                    content.push(`   ${filtered.join(' | ')}`);
                }
            });
        });
        sections.push({
            title: '议题二 组织人才与能力建设',
            lines: content
        });
    }
    
    // 议题三：机制流程
    let compliance = getTbodyDataForText('complianceTbody', true);
    if (compliance.length > 0) {
        let content = [];
        compliance.forEach((item, idx) => {
            content.push(`${idx + 1}. 事项：${item[0] || '—'}`);
            content.push(`   计划说明：${item[1] || '—'} | 负责人：${item[2] || '—'} | 完成时间：${item[3] || '—'}`);
        });
        sections.push({
            title: '议题三 机制流程/信息安全/质量合规',
            lines: content
        });
    }
    
    // 议题四：具体业务
    let bizData = getDynamicDataForText('bizTablesContainer');
    if (bizData.length > 0) {
        let content = [];
        bizData.forEach(cat => {
            content.push(`${cat.category}`);
            cat.rows.forEach(row => {
                let filtered = row.filter(v => v && v !== '');
                if (filtered.length > 0) {
                    content.push(`   ${filtered.join(' | ')}`);
                }
            });
        });
        sections.push({
            title: '议题四 具体业务',
            lines: content
        });
    }
    
    // 议题五：共同决策
    let decisions = getTbodyDataForText('decisionTbody', true);
    if (decisions.length > 0) {
        let content = [];
        decisions.forEach((dec, idx) => {
            content.push(`${idx + 1}. 事项：${dec[0] || '—'}`);
            content.push(`   背景/选项逻辑：${dec[1] || '—'}`);
            content.push(`   建议方案：${dec[2] || '—'}`);
        });
        sections.push({
            title: '议题五 共同决策',
            lines: content
        });
    }
    
    // 议题六：其他
    let others = getTbodyDataForText('otherTbody', true);
    if (others.length > 0) {
        let content = [];
        others.forEach((other, idx) => {
            content.push(`${idx + 1}. 事项：${other[0] || '—'}`);
            content.push(`   说明：${other[1] || '—'}`);
            content.push(`   建议：${other[2] || '—'} | 提出人：${other[3] || '—'}`);
        });
        sections.push({
            title: '议题六 其他事项',
            lines: content
        });
    }
    
    // 构建最终报告
    let report = `【电气周会议题收集报告】
填写人：${filler}
周次：${week}
生成时间：${now}

`;
    
    for (let i = 0; i < sections.length; i++) {
        let s = sections[i];
        report += `${s.title}\n`;
        report += s.lines.join('\n');
        if (i < sections.length - 1) {
            report += '\n\n';
        }
    }
    
    return report;
}

/**
 * 复制汇报文本到剪贴板
 */
async function copyReportToClipboard() {
    let filler = document.getElementById('fillerName').value;
    if (!filler) {
        alert('❌ 请先选择填写人！');
        return;
    }
    
    const text = generateTextReport();
    
    try {
        await navigator.clipboard.writeText(text);
        alert('✅ 汇报文本已复制到剪贴板！\n\n📱 请直接打开企业微信，粘贴到周会沟通群。');
    } catch (err) {
        console.error('复制失败:', err);
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('✅ 已复制！\n\n请到企业微信粘贴发送。');
    }
}