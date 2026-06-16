// ==================== 企业微信智能表格提交模块 ====================

// 替换为你的智能表格 Webhook 地址
const SMART_SHEET_WEBHOOK_URL = "https://qyapi.weixin.qq.com/cgi-bin/wedoc/smartsheet/webhook?key=6DMSwlWKO6zPmo09M6JRDB2mhuAGu08kS5mdJeeoYZtTe6RYLE3Aw77pHRzmDwU4QcxBJXkD7ZACjILmeRMV7Y6xgOBLz7J7w1U98pp2C8Kb";

/**
 * 将日期字符串转换为毫秒时间戳字符串
 * @param {string} dateStr - 日期字符串，如 "2026/6/12" 或 "6/12"
 * @returns {string|null} 毫秒时间戳字符串
 */
function parseDateToTimestamp(dateStr) {
    if (!dateStr || dateStr === '持续跟进' || dateStr === '本周' || dateStr === '') {
        return null;
    }
    
    let date = new Date();
    const currentYear = date.getFullYear();
    
    let parts = dateStr.split('/');
    if (parts.length === 2) {
        // 格式如 "6/12"
        date = new Date(currentYear, parseInt(parts[0]) - 1, parseInt(parts[1]));
    } else if (parts.length === 3) {
        // 格式如 "2026/6/12"
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
        return null;
    }
    
    if (isNaN(date.getTime())) {
        return null;
    }
    
    // 返回毫秒时间戳字符串
    return date.getTime().toString();
}

/**
 * 获取当前毫秒时间戳字符串
 * @returns {string} 毫秒时间戳字符串
 */
function getCurrentTimestamp() {
    return Date.now().toString();
}

/**
 * 获取当前日期零点的时间戳（用于时间字段）
 * @returns {string} 当天0点的毫秒时间戳字符串
 */
function getCurrentDateTimestamp() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime().toString();
}

/**
 * 格式化单选字段的值
 * @param {string} value - 选项值
 * @returns {Array<{text: string}>|null} 企微单选格式
 */
function formatSingleSelect(value) {
    if (!value) return null;
    return [{ text: value }];
}

/**
 * 格式化多选字段的值
 * @param {Array<string>} values - 选项值数组
 * @returns {Array<{text: string}>|null} 企微多选格式
 */
function formatMultipleSelect(values) {
    if (!values || values.length === 0) return null;
    const validValues = values.filter(v => v && v !== '');
    if (validValues.length === 0) return null;
    return validValues.map(v => ({ text: v }));
}

/**
 * 提交单条记录到智能表格
 * @param {Object} record - 单条记录对象
 * @returns {Promise<boolean>}
 */
async function submitRecordToSmartSheet(record) {
    try {
        const response = await fetch(SMART_SHEET_WEBHOOK_URL, {
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

/**
 * 批量提交多条记录
 * @param {Array<Object>} records - 记录数组
 * @returns {Promise<{success: number, fail: number}>}
 */
async function batchSubmitToSmartSheet(records) {
    let success = 0, fail = 0;
    
    for (const record of records) {
        const result = await submitRecordToSmartSheet(record);
        if (result) success++;
        else fail++;
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return { success, fail };
}

/**
 * 从填写数据生成智能表格记录列表
 * @returns {Array<Object>} 记录数组
 */
function generateSmartSheetRecords() {
    const filler = document.getElementById('fillerName').value;
    if (!filler) return [];
    
    const week = document.getElementById('fillWeek').value || getCurrentWeekRangeText();
    const currentTimestamp = getCurrentTimestamp();
    const currentDateTimestamp = getCurrentDateTimestamp();
    
    // 从周次文本中提取日期范围，用于时间字段（使用周一的日期）
    const weekMatch = week.match(/\((\d+)\/(\d+)-/);
    let weekStartTimestamp = currentDateTimestamp;
    if (weekMatch) {
        const month = parseInt(weekMatch[1]);
        const day = parseInt(weekMatch[2]);
        const currentYear = new Date().getFullYear();
        const weekStartDate = new Date(currentYear, month - 1, day);
        if (!isNaN(weekStartDate.getTime())) {
            weekStartTimestamp = weekStartDate.getTime().toString();
        }
    }
    
    const records = [];
    
    // ========== 议题一：上周任务闭环 ==========
    const tasks = getTbodyDataForText('taskTbody', false);
    tasks.forEach(task => {
        if (!task[0] || task[0] === '') return;
        
        // 状态映射
        let statusText = "进行";
        let closedText = "持续中";
        if (task[3] === '✅ 已完成') {
            statusText = "完成";
            closedText = "按时闭环";
        } else if (task[3] === '🔴 未完成') {
            statusText = "流产";
            closedText = "延后闭环";
        } else if (task[3] === '🟡 进行中') {
            statusText = "进行";
            closedText = "持续中";
        }
        
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
        
        // 清理 null 值
        Object.keys(record).forEach(key => {
            if (record[key] === null || record[key] === undefined) {
                delete record[key];
            }
        });
        
        records.push(record);
    });
    
    // ========== 议题二：组织人才与能力建设 ==========
    const orgData = getDynamicDataForText('orgTablesContainer');
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
                if (record[key] === null || record[key] === undefined) {
                    delete record[key];
                }
            });
            
            records.push(record);
        });
    });
    
    // ========== 议题三：机制流程 ==========
    const compliance = getTbodyDataForText('complianceTbody', true);
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
            if (record[key] === null || record[key] === undefined) {
                delete record[key];
            }
        });
        
        records.push(record);
    });
    
    // ========== 议题四：具体业务 ==========
    const bizData = getDynamicDataForText('bizTablesContainer');
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
                if (record[key] === null || record[key] === undefined) {
                    delete record[key];
                }
            });
            
            records.push(record);
        });
    });
    
    // ========== 议题五：共同决策 ==========
    const decisions = getTbodyDataForText('decisionTbody', true);
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
            if (record[key] === null || record[key] === undefined) {
                delete record[key];
            }
        });
        
        records.push(record);
    });
    
    // ========== 议题六：其他 ==========
    const others = getTbodyDataForText('otherTbody', true);
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
            if (record[key] === null || record[key] === undefined) {
                delete record[key];
            }
        });
        
        records.push(record);
    });
    
    return records;
}

/**
 * 主函数：提交所有填写数据到智能表格
 */
async function submitToSmartSheet() {
    const filler = document.getElementById('fillerName').value;
    if (!filler) {
        alert('❌ 请先选择填写人！');
        return;
    }
    
    if (SMART_SHEET_WEBHOOK_URL.includes('YOUR_WEBHOOK_KEY')) {
        alert('⚠️ 请先配置智能表格 Webhook 地址！\n\n在 smartSheetModule.js 中修改 SMART_SHEET_WEBHOOK_URL 变量。');
        return;
    }
    
    const records = generateSmartSheetRecords();
    
    if (records.length === 0) {
        alert('⚠️ 没有可提交的数据，请先填写内容！');
        return;
    }
    
    if (!confirm(`即将提交 ${records.length} 条记录到智能表格，确认提交吗？`)) return;
    
    const submitBtn = document.getElementById('submitToSheetBtn');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = '⏳ 提交中...';
    submitBtn.disabled = true;
    
    const result = await batchSubmitToSmartSheet(records);
    
    submitBtn.innerText = originalText;
    submitBtn.disabled = false;
    
    if (result.fail === 0) {
        alert(`✅ 全部提交成功！共 ${result.success} 条记录已写入智能表格。`);
    } else {
        alert(`⚠️ 提交完成：成功 ${result.success} 条，失败 ${result.fail} 条。\n请检查网络或联系管理员。`);
    }
}