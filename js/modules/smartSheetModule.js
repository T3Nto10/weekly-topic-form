// ==================== 企业微信智能表格提交模块 ====================

// ===== 填写模式 Webhook 地址（原有，保持不变） =====
const SMART_SHEET_WEBHOOK_URL = "https://qyapi.weixin.qq.com/cgi-bin/wedoc/smartsheet/webhook?key=6DMSwlWKO6zPmo09M6JRDB2mhuAGu08kS5mdJeeoYZtTe6RYLE3Aw77pHRzmDwU4QcxBJXkD7ZACjILmeRMV7Y6xgOBLz7J7w1U98pp2C8Kb";

// ===== 看板模式 Webhook 地址（新增，独立配置） =====
const SMART_SHEET_WEBHOOK_URL_DASHBOARD = "https://qyapi.weixin.qq.com/cgi-bin/wedoc/smartsheet/webhook?key=70O2Z7537M8KhYcWbY8d7g23egOiJjoOyvgyls84VZHJedoIoNTCJp2CoE59DhzgqYefdhuISZGnYJ6znw45vI7LaFU6onEgjFHsB33fH5qb";

// ============================================================
// 工具函数（安全版本，不依赖外部函数）
// ============================================================

/**
 * 获取表格数据（安全版本）
 */
function safeGetTbodyData(tbodyId, excludeLastOpCol = true) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return [];
    
    const rows = [];
    for (const tr of tbody.querySelectorAll('tr')) {
        const row = [];
        const cells = tr.querySelectorAll('td');
        const maxLen = excludeLastOpCol ? cells.length - 1 : cells.length;
        for (let i = 0; i < maxLen; i++) {
            const inp = cells[i]?.querySelector('input,textarea,select');
            const value = inp ? inp.value : (cells[i]?.innerText?.trim() || '');
            if (value !== '点击下方按钮添加事项' && value !== '点击下方按钮添加决策项') {
                row.push(value);
            } else {
                row.push('');
            }
        }
        if (row.some(v => v && v !== '')) {
            rows.push(row);
        }
    }
    return rows;
}

/**
 * 获取动态分类数据（安全版本）
 */
function safeGetDynamicData(containerId) {
    const result = [];
    const container = document.getElementById(containerId);
    if (!container) return result;
    
    for (const div of container.querySelectorAll(':scope > div')) {
        const titleSpan = div.querySelector('div:first-child span:first-child');
        const category = titleSpan ? titleSpan.innerText.replace('📌', '').trim() : '';
        const rows = [];
        const table = div.querySelector('table');
        if (table) {
            const tbody = table.querySelector('tbody');
            if (tbody) {
                for (const tr of tbody.querySelectorAll('tr')) {
                    const row = [];
                    for (const td of tr.querySelectorAll('td')) {
                        const inp = td.querySelector('input,textarea,select');
                        row.push(inp ? inp.value : '');
                    }
                    if (row.some(v => v && v !== '')) {
                        rows.push(row);
                    }
                }
            }
        }
        if (category && rows.length > 0) {
            result.push({ category, rows });
        }
    }
    return result;
}

// ============================================================
// 日期工具函数
// ============================================================

function parseDateToTimestamp(dateStr) {
    if (!dateStr || dateStr === '持续跟进' || dateStr === '本周' || dateStr === '') return null;
    
    let date = new Date();
    const currentYear = date.getFullYear();
    let parts = dateStr.split('/');
    
    if (parts.length === 2) {
        date = new Date(currentYear, parseInt(parts[0]) - 1, parseInt(parts[1]));
    } else if (parts.length === 3) {
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
        return null;
    }
    if (isNaN(date.getTime())) return null;
    return date.getTime().toString();
}

function getCurrentTimestamp() {
    return Date.now().toString();
}

function getWeekStartTimestamp(week) {
    const weekMatch = week.match(/\((\d+)\/(\d+)-/);
    if (weekMatch) {
        const month = parseInt(weekMatch[1]);
        const day = parseInt(weekMatch[2]);
        const currentYear = new Date().getFullYear();
        const weekStartDate = new Date(currentYear, month - 1, day);
        if (!isNaN(weekStartDate.getTime())) {
            return weekStartDate.getTime().toString();
        }
    }
    return Date.now().toString();
}

function formatSingleSelect(value) {
    if (!value) return null;
    return [{ text: value }];
}

function formatMultipleSelect(values) {
    if (!values || values.length === 0) return null;
    const validValues = values.filter(v => v && v !== '');
    if (validValues.length === 0) return null;
    return validValues.map(v => ({ text: v }));
}

// ============================================================
// 提交核心函数
// ============================================================

async function submitRecordToSmartSheet(webhookUrl, record) {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ add_records: [{ values: record }] })
        });
        const result = await response.json();
        if (result.errcode === 0) {
            console.log('✅ 提交成功');
            return true;
        } else {
            console.error('❌ 提交失败:', result);
            return false;
        }
    } catch (error) {
        console.error('❌ 网络错误:', error);
        return false;
    }
}

async function batchSubmitToSmartSheet(webhookUrl, records) {
    let success = 0, fail = 0;
    for (const record of records) {
        const result = await submitRecordToSmartSheet(webhookUrl, record);
        if (result) success++;
        else fail++;
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    return { success, fail };
}

// ============================================================
// 填写模式：生成记录（原有逻辑，使用 SMART_SHEET_WEBHOOK_URL）
// ============================================================

function generateFillSmartSheetRecords() {
    const filler = document.getElementById('fillerName')?.value;
    if (!filler) {
        console.warn('没有选择填写人');
        return [];
    }
    
    const week = document.getElementById('fillWeek')?.value || getCurrentWeekRangeText();
    const currentTimestamp = getCurrentTimestamp();
    const weekStartTimestamp = getWeekStartTimestamp(week);
    
    const records = [];
    
    // ===== 议题一：任务闭环 =====
    const tasks = safeGetTbodyData('taskTbody', false);
    tasks.forEach(task => {
        if (!task[0] || task[0] === '') return;
        
        let statusText = "进行", closedText = "持续中";
        if (task[3] === '✅ 已完成') { statusText = "完成"; closedText = "按时闭环"; }
        else if (task[3] === '🔴 未完成') { statusText = "流产"; closedText = "延后闭环"; }
        
        const record = {
            "f04Gwj": weekStartTimestamp,
            "feIrbQ": filler,
            "ftQMc5": formatSingleSelect(filler),
            "ftk5Tx": formatMultipleSelect([filler]),
            "fw44LP": formatMultipleSelect([task[5] || filler]),
            "fF4gP2": formatSingleSelect("上周任务闭环回顾"),
            "f1iUUp": "任务闭环",
            "fhtXVm": task[0],
            "fszX2I": formatMultipleSelect([task[5] || filler]),
            "fNhjT1": formatSingleSelect(statusText),
            "foplAb": currentTimestamp,
            "flABgk": parseDateToTimestamp(task[2]),
            "fprFhL": task[4] ? currentTimestamp : null,
            "fT5yC0": task[4] || '',
            "fCf7VN": formatSingleSelect(closedText)
        };
        
        Object.keys(record).forEach(key => {
            if (record[key] === null || record[key] === undefined) delete record[key];
        });
        records.push(record);
    });
    
    // ===== 议题二：组织人才 =====
    const orgData = safeGetDynamicData('orgTablesContainer');
    orgData.forEach(cat => {
        cat.rows.forEach(row => {
            const rowText = row.filter(v => v && v !== '').join(' | ');
            if (!rowText) return;
            
            const record = {
                "f04Gwj": weekStartTimestamp,
                "feIrbQ": filler,
                "ftQMc5": formatSingleSelect(filler),
                "ftk5Tx": formatMultipleSelect([filler]),
                "fw44LP": formatMultipleSelect([filler]),
                "fF4gP2": formatSingleSelect("组织人才建设"),
                "f1iUUp": cat.category,
                "fhtXVm": rowText.substring(0, 500),
                "fszX2I": formatMultipleSelect([filler]),
                "fNhjT1": formatSingleSelect("进行"),
                "foplAb": currentTimestamp,
                "fT5yC0": rowText,
                "fCf7VN": formatSingleSelect("持续中")
            };
            Object.keys(record).forEach(key => {
                if (record[key] === null || record[key] === undefined) delete record[key];
            });
            records.push(record);
        });
    });
    
    // ===== 议题三：机制流程 =====
    const compliance = safeGetTbodyData('complianceTbody', true);
    compliance.forEach(item => {
        if (!item[0] || item[0] === '') return;
        const record = {
            "f04Gwj": weekStartTimestamp,
            "feIrbQ": filler,
            "ftQMc5": formatSingleSelect(filler),
            "ftk5Tx": formatMultipleSelect([filler]),
            "fw44LP": formatMultipleSelect([item[2] || filler]),
            "fF4gP2": formatSingleSelect("机制流程/信息安全/质量合规"),
            "f1iUUp": "机制流程",
            "fhtXVm": item[0],
            "fszX2I": formatMultipleSelect([item[2] || filler]),
            "fNhjT1": formatSingleSelect("进行"),
            "foplAb": currentTimestamp,
            "flABgk": parseDateToTimestamp(item[3]),
            "fT5yC0": item[1] || '',
            "fCf7VN": formatSingleSelect("持续中")
        };
        Object.keys(record).forEach(key => {
            if (record[key] === null || record[key] === undefined) delete record[key];
        });
        records.push(record);
    });
    
    // ===== 议题四：具体业务 =====
    const bizData = safeGetDynamicData('bizTablesContainer');
    bizData.forEach(cat => {
        cat.rows.forEach(row => {
            const rowText = row.filter(v => v && v !== '').join(' | ');
            if (!rowText) return;
            const record = {
                "f04Gwj": weekStartTimestamp,
                "feIrbQ": filler,
                "ftQMc5": formatSingleSelect(filler),
                "ftk5Tx": formatMultipleSelect([filler]),
                "fw44LP": formatMultipleSelect([filler]),
                "fF4gP2": formatSingleSelect("具体项目业务"),
                "f1iUUp": cat.category,
                "fhtXVm": rowText.substring(0, 500),
                "fszX2I": formatMultipleSelect([filler]),
                "fNhjT1": formatSingleSelect("进行"),
                "foplAb": currentTimestamp,
                "fT5yC0": rowText,
                "fCf7VN": formatSingleSelect("持续中")
            };
            Object.keys(record).forEach(key => {
                if (record[key] === null || record[key] === undefined) delete record[key];
            });
            records.push(record);
        });
    });
    
    // ===== 议题五：共同决策 =====
    const decisions = safeGetTbodyData('decisionTbody', true);
    decisions.forEach(dec => {
        if (!dec[0] || dec[0] === '') return;
        const record = {
            "f04Gwj": weekStartTimestamp,
            "feIrbQ": filler,
            "ftQMc5": formatSingleSelect(filler),
            "ftk5Tx": formatMultipleSelect([filler]),
            "fw44LP": formatMultipleSelect([filler]),
            "fF4gP2": formatSingleSelect("其他"),
            "f1iUUp": "共同决策",
            "fhtXVm": dec[0],
            "fNhjT1": formatSingleSelect("进行"),
            "foplAb": currentTimestamp,
            "fT5yC0": `背景：${dec[1] || ''} | 建议：${dec[2] || ''}`,
            "fCf7VN": formatSingleSelect("持续中")
        };
        Object.keys(record).forEach(key => {
            if (record[key] === null || record[key] === undefined) delete record[key];
        });
        records.push(record);
    });
    
    // ===== 议题六：其他 =====
    const others = safeGetTbodyData('otherTbody', true);
    others.forEach(other => {
        if (!other[0] || other[0] === '') return;
        const record = {
            "f04Gwj": weekStartTimestamp,
            "feIrbQ": filler,
            "ftQMc5": formatSingleSelect(filler),
            "ftk5Tx": formatMultipleSelect([filler]),
            "fw44LP": formatMultipleSelect([other[3] || filler]),
            "fF4gP2": formatSingleSelect("其他"),
            "f1iUUp": "其他事项",
            "fhtXVm": other[0],
            "fszX2I": formatMultipleSelect([other[3] || filler]),
            "fNhjT1": formatSingleSelect("进行"),
            "foplAb": currentTimestamp,
            "fT5yC0": `说明：${other[1] || ''} | 建议：${other[2] || ''}`,
            "fCf7VN": formatSingleSelect("持续中")
        };
        Object.keys(record).forEach(key => {
            if (record[key] === null || record[key] === undefined) delete record[key];
        });
        records.push(record);
    });
    
    return records;
}

// ============================================================
// 填写模式：提交主函数（使用 SMART_SHEET_WEBHOOK_URL，保持不变）
// ============================================================

async function submitFillToSmartSheet() {
    console.log('✅ submitFillToSmartSheet 被调用了！');
    
    const filler = document.getElementById('fillerName')?.value;
    if (!filler) {
        alert('❌ 请先选择填写人！');
        return;
    }
    
    if (SMART_SHEET_WEBHOOK_URL.includes('YOUR_FILL_WEBHOOK_KEY')) {
        alert('⚠️ 请先配置填写模式的智能表格 Webhook 地址！\n\n在 smartSheetModule.js 中修改 SMART_SHEET_WEBHOOK_URL 变量。');
        return;
    }
    
    const records = generateFillSmartSheetRecords();
    console.log('📊 生成的记录数:', records.length);
    
    if (records.length === 0) {
        alert('⚠️ 没有可提交的数据，请先填写内容！');
        return;
    }
    
    if (!confirm(`即将提交 ${records.length} 条记录到智能表格，确认提交吗？`)) return;
    
    const submitBtn = document.getElementById('submitToSheetBtn');
    if (submitBtn) {
        submitBtn.innerText = '⏳ 提交中...';
        submitBtn.disabled = true;
    }
    
    const result = await batchSubmitToSmartSheet(SMART_SHEET_WEBHOOK_URL, records);
    
    if (submitBtn) {
        submitBtn.innerText = '📤 提交到智能表格';
        submitBtn.disabled = false;
    }
    
    if (result.fail === 0) {
        alert(`✅ 全部提交成功！共 ${result.success} 条记录已写入智能表格。`);
    } else {
        alert(`⚠️ 提交完成：成功 ${result.success} 条，失败 ${result.fail} 条。\n请检查网络或联系管理员。`);
    }
}

// ============================================================
// 看板模式：生成记录（独立实现，不依赖填写逻辑）
// ============================================================

function generateDashboardSmartSheetRecords() {
    const week = getCurrentWeekRangeText();
    const currentTimestamp = getCurrentTimestamp();
    const weekStartTimestamp = getWeekStartTimestamp(week);
    const records = [];
    
    // ===== 议题一：任务闭环 =====
    (dashboardData.task_closed || []).forEach(task => {
        if (!task.task || task.task === '') return;
        let statusText = "进行", closedText = "持续中";
        if (task.actualStatus === '✅ 已完成') { statusText = "完成"; closedText = "按时闭环"; }
        else if (task.actualStatus === '🔴 未完成') { statusText = "流产"; closedText = "延后闭环"; }
        
        const record = {
            "f04Gwj": weekStartTimestamp,
            "feIrbQ": "看板汇总",
            "ftQMc5": formatSingleSelect("看板汇总"),
            "ftk5Tx": formatMultipleSelect(["看板汇总"]),
            "fw44LP": formatMultipleSelect([task.owner || "看板汇总"]),
            "fF4gP2": formatSingleSelect("上周任务闭环回顾"),
            "f1iUUp": "任务闭环",
            "fhtXVm": task.task,
            "fszX2I": formatMultipleSelect([task.owner || "看板汇总"]),
            "fNhjT1": formatSingleSelect(statusText),
            "foplAb": currentTimestamp,
            "flABgk": parseDateToTimestamp(task.expectDate),
            "fprFhL": task.statusDetail ? currentTimestamp : null,
            "fT5yC0": task.statusDetail || '',
            "fCf7VN": formatSingleSelect(closedText)
        };
        Object.keys(record).forEach(key => {
            if (record[key] === null || record[key] === undefined) delete record[key];
        });
        records.push(record);
    });
    
    // ===== 议题二：组织人才 =====
    (dashboardData.org_dynamic || []).forEach(cat => {
        (cat.rows || []).forEach(row => {
            const rowText = Object.values(row).filter(v => v && v !== '').join(' | ');
            if (!rowText) return;
            const record = {
                "f04Gwj": weekStartTimestamp,
                "feIrbQ": "看板汇总",
                "ftQMc5": formatSingleSelect("看板汇总"),
                "ftk5Tx": formatMultipleSelect(["看板汇总"]),
                "fw44LP": formatMultipleSelect(["看板汇总"]),
                "fF4gP2": formatSingleSelect("组织人才建设"),
                "f1iUUp": cat.category,
                "fhtXVm": rowText.substring(0, 500),
                "fszX2I": formatMultipleSelect(["看板汇总"]),
                "fNhjT1": formatSingleSelect("进行"),
                "foplAb": currentTimestamp,
                "fT5yC0": rowText,
                "fCf7VN": formatSingleSelect("持续中")
            };
            Object.keys(record).forEach(key => {
                if (record[key] === null || record[key] === undefined) delete record[key];
            });
            records.push(record);
        });
    });
    
    // ===== 议题三：机制流程 =====
    (dashboardData.compliance || []).forEach(item => {
        if (!item.事项 || item.事项 === '') return;
        const record = {
            "f04Gwj": weekStartTimestamp,
            "feIrbQ": "看板汇总",
            "ftQMc5": formatSingleSelect("看板汇总"),
            "ftk5Tx": formatMultipleSelect(["看板汇总"]),
            "fw44LP": formatMultipleSelect([item.负责人 || "看板汇总"]),
            "fF4gP2": formatSingleSelect("机制流程/信息安全/质量合规"),
            "f1iUUp": "机制流程",
            "fhtXVm": item.事项,
            "fszX2I": formatMultipleSelect([item.负责人 || "看板汇总"]),
            "fNhjT1": formatSingleSelect(item.当前状态 === '完成' ? '完成' : '进行'),
            "foplAb": currentTimestamp,
            "flABgk": parseDateToTimestamp(item.完成时间),
            "fT5yC0": item.本周进展 || '',
            "fCf7VN": formatSingleSelect(item.当前状态 === '完成' ? '按时闭环' : '持续中')
        };
        Object.keys(record).forEach(key => {
            if (record[key] === null || record[key] === undefined) delete record[key];
        });
        records.push(record);
    });
    
    // ===== 议题四：具体业务 =====
    (dashboardData.biz_dynamic || []).forEach(cat => {
        (cat.rows || []).forEach(row => {
            const rowText = Object.values(row).filter(v => v && v !== '').join(' | ');
            if (!rowText) return;
            const record = {
                "f04Gwj": weekStartTimestamp,
                "feIrbQ": "看板汇总",
                "ftQMc5": formatSingleSelect("看板汇总"),
                "ftk5Tx": formatMultipleSelect(["看板汇总"]),
                "fw44LP": formatMultipleSelect(["看板汇总"]),
                "fF4gP2": formatSingleSelect("具体项目业务"),
                "f1iUUp": cat.category,
                "fhtXVm": rowText.substring(0, 500),
                "fszX2I": formatMultipleSelect(["看板汇总"]),
                "fNhjT1": formatSingleSelect("进行"),
                "foplAb": currentTimestamp,
                "fT5yC0": rowText,
                "fCf7VN": formatSingleSelect("持续中")
            };
            Object.keys(record).forEach(key => {
                if (record[key] === null || record[key] === undefined) delete record[key];
            });
            records.push(record);
        });
    });
    
    // ===== 议题五：共同决策 =====
    (dashboardData.decision || []).forEach(dec => {
        if (!dec.决策事项 || dec.决策事项 === '') return;
        const record = {
            "f04Gwj": weekStartTimestamp,
            "feIrbQ": "看板汇总",
            "ftQMc5": formatSingleSelect("看板汇总"),
            "ftk5Tx": formatMultipleSelect(["看板汇总"]),
            "fw44LP": formatMultipleSelect(["看板汇总"]),
            "fF4gP2": formatSingleSelect("其他"),
            "f1iUUp": "共同决策",
            "fhtXVm": dec.决策事项,
            "fNhjT1": formatSingleSelect("进行"),
            "foplAb": currentTimestamp,
            "fT5yC0": `背景：${dec.背景选项逻辑 || ''} | 建议：${dec.建议方案 || ''}`,
            "fCf7VN": formatSingleSelect("持续中")
        };
        Object.keys(record).forEach(key => {
            if (record[key] === null || record[key] === undefined) delete record[key];
        });
        records.push(record);
    });
    
    // ===== 议题六：其他 =====
    (dashboardData.other || []).forEach(other => {
        if (!other.事项 || other.事项 === '') return;
        const record = {
            "f04Gwj": weekStartTimestamp,
            "feIrbQ": "看板汇总",
            "ftQMc5": formatSingleSelect("看板汇总"),
            "ftk5Tx": formatMultipleSelect(["看板汇总"]),
            "fw44LP": formatMultipleSelect([other.提出人 || "看板汇总"]),
            "fF4gP2": formatSingleSelect("其他"),
            "f1iUUp": "其他事项",
            "fhtXVm": other.事项,
            "fszX2I": formatMultipleSelect([other.提出人 || "看板汇总"]),
            "fNhjT1": formatSingleSelect("进行"),
            "foplAb": currentTimestamp,
            "fT5yC0": `说明：${other.说明 || ''} | 建议：${other.建议 || ''}`,
            "fCf7VN": formatSingleSelect("持续中")
        };
        Object.keys(record).forEach(key => {
            if (record[key] === null || record[key] === undefined) delete record[key];
        });
        records.push(record);
    });
    
    return records;
}

// ============================================================
// 看板模式：提交主函数（使用 SMART_SHEET_WEBHOOK_URL_DASHBOARD）
// ============================================================

async function submitDashboardToSmartSheet() {
    console.log('✅ submitDashboardToSmartSheet 被调用了！');
    
    if (SMART_SHEET_WEBHOOK_URL_DASHBOARD.includes('YOUR_DASHBOARD_WEBHOOK_KEY')) {
        alert('⚠️ 请先配置看板模式的智能表格 Webhook 地址！\n\n在 smartSheetModule.js 中修改 SMART_SHEET_WEBHOOK_URL_DASHBOARD 变量。');
        return;
    }
    
    const records = generateDashboardSmartSheetRecords();
    console.log('📊 看板记录数:', records.length);
    
    if (records.length === 0) {
        alert('⚠️ 没有可提交的数据！');
        return;
    }
    
    if (!confirm(`即将提交 ${records.length} 条记录到智能表格，确认提交吗？`)) return;
    
    const submitBtn = document.getElementById('submitDashboardToSheetBtn');
    if (submitBtn) {
        submitBtn.innerText = '⏳ 提交中...';
        submitBtn.disabled = true;
    }
    
    const result = await batchSubmitToSmartSheet(SMART_SHEET_WEBHOOK_URL_DASHBOARD, records);
    
    if (submitBtn) {
        submitBtn.innerText = '📤 提交到智能表格';
        submitBtn.disabled = false;
    }
    
    if (result.fail === 0) {
        alert(`✅ 全部提交成功！共 ${result.success} 条记录已写入看板表格。`);
    } else {
        alert(`⚠️ 提交完成：成功 ${result.success} 条，失败 ${result.fail} 条。\n请检查网络或联系管理员。`);
    }
}

// ============================================================
// 导出到 window
// ============================================================

window.submitFillToSmartSheet = submitFillToSmartSheet;
window.submitDashboardToSmartSheet = submitDashboardToSmartSheet;