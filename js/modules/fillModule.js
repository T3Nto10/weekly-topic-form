// ==================== 填写模式核心逻辑模块 ====================

/**
 * 更新人员下拉框选项
 */
function updatePersonSelect() {
    const sel = document.getElementById('fillerName');
    if (!sel) return;
    let cur = sel.value;
    sel.innerHTML = '<option value="">请选择</option>' + personList.map(n => `<option value="${n}">${n}</option>`).join('');
    if (cur && personList.includes(cur)) sel.value = cur;
    else onFillerChange();
}

/**
 * 填写人切换时的回调函数
 * 加载该人员负责的上周任务
 */
function onFillerChange() {
    let filler = document.getElementById('fillerName').value;
    let tbody = document.getElementById('taskTbody');
    let tip = document.getElementById('taskTip');
    
    if (!filler) {
        tip.innerHTML = '💡 请先在上方选择填写人';
        tbody.innerHTML = '';
        return;
    }
    
    let tasks = taskLibrary[filler] || [];
    tip.innerHTML = `✅ 已加载 ${filler} 负责的 ${tasks.length} 项上周任务（W23），请确认完成情况`;
    tbody.innerHTML = '';
    
    if (!tasks.length) {
        tip.innerHTML = `ℹ️ ${filler}：您上周没有待办项（W23），本议题可跳过`;
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#6c86a3;">无待办任务</td></tr>';
        return;
    }
    
    tasks.forEach(t => {
        let row = tbody.insertRow();
        
        // 任务描述
        let td1 = row.insertCell(0);
        let ta = document.createElement('textarea');
        ta.rows = 2;
        ta.style.width = '100%';
        ta.value = t.task;
        td1.appendChild(ta);
        
        // 提出周次
        let td2 = row.insertCell(1);
        let inpWeek = document.createElement('input');
        inpWeek.value = t.proposeWeek;
        inpWeek.readOnly = true;
        inpWeek.style.background = '#f5f5f5';
        td2.appendChild(inpWeek);
        
        // 预计完成时间
        let td3 = row.insertCell(2);
        let inpDeadline = document.createElement('input');
        inpDeadline.value = t.deadline;
        inpDeadline.readOnly = true;
        inpDeadline.style.background = '#f5f5f5';
        td3.appendChild(inpDeadline);
        
        // 实际完成情况（下拉选择）
        let td4 = row.insertCell(3);
        let sel = document.createElement('select');
        sel.innerHTML = '<option value="">请选择</option><option>✅ 已完成</option><option>🔴 未完成</option><option>🟡 进行中</option>';
        td4.appendChild(sel);
        
        // 完成情况说明
        let td5 = row.insertCell(4);
        let rea = document.createElement('textarea');
        rea.rows = 2;
        rea.placeholder = '填写完成情况说明（完成内容、遇到的问题、下一步计划等）';
        td5.appendChild(rea);
        
        // 负责人
        let td6 = row.insertCell(5);
        let owner = document.createElement('input');
        owner.value = filler;
        owner.readOnly = true;
        owner.style.background = '#f5f5f5';
        td6.appendChild(owner);
    });
}

/**
 * 清空当前填写的所有数据
 */
function clearFillData() {
    if (!confirm('清空当前填写的所有数据吗？')) return;
    
    document.getElementById('fillerName').value = '';
    document.getElementById('taskTbody').innerHTML = '';
    document.getElementById('taskTip').innerHTML = '💡 请先在上方选择填写人';
    document.getElementById('orgTablesContainer').innerHTML = '';
    document.getElementById('bizTablesContainer').innerHTML = '';
    document.getElementById('complianceTbody').innerHTML = '<tr><td colspan="7" style="text-align:center;">点击下方按钮添加事项</td><td style="display:none;"></td></tr>';
    document.getElementById('decisionTbody').innerHTML = '<tr><td colspan="6" style="text-align:center;">点击下方按钮添加决策项</td><td style="display:none;"></td></tr>';
    document.getElementById('otherTbody').innerHTML = '<tr><td colspan="5" style="text-align:center;">点击下方按钮添加事项</td><td style="display:none;"></td></tr>';
}

/**
 * 导出填写数据为JSON（备用功能）
 */
function exportFillData() {
    let filler = document.getElementById('fillerName').value || '未填写';
    let week = document.getElementById('fillWeek').value || getCurrentWeekRangeText();
    // 可在此添加导出逻辑
    alert(`导出功能：填写人 ${filler}，周次 ${week}\n（可在此扩展导出JSON逻辑）`);
}

/**
 * 获取表格数据（用于生成文本报告）
 * @param {string} tbodyId - tbody的ID
 * @param {boolean} excludeLastOpCol - 是否排除最后一列操作列
 * @returns {Array} 表格数据数组
 */
function getTbodyDataForText(tbodyId, excludeLastOpCol = true) {
    let tbody = document.getElementById(tbodyId);
    if (!tbody) return [];
    let rows = [];
    for (let tr of tbody.querySelectorAll('tr')) {
        let row = [];
        let cells = tr.querySelectorAll('td');
        let maxLen = excludeLastOpCol ? cells.length - 1 : cells.length;
        for (let i = 0; i < maxLen; i++) {
            let inp = cells[i].querySelector('input,textarea,select');
            let value = inp ? inp.value : cells[i].innerText.trim();
            if (value === '点击下方按钮添加事项' || value === '点击下方按钮添加决策项') value = '';
            row.push(value);
        }
        if (row.some(v => v && v !== '')) rows.push(row);
    }
    return rows;
}

/**
 * 获取动态分类数据（用于生成文本报告）
 * @param {string} containerId - 容器的ID
 * @returns {Array} 动态分类数据数组
 */
function getDynamicDataForText(containerId) {
    let result = [];
    let containers = document.querySelectorAll(`#${containerId} > div`);
    containers.forEach(div => {
        let titleSpan = div.querySelector('div:first-child span:first-child');
        let category = titleSpan ? titleSpan.innerText.replace('📌', '').trim() : '';
        let rows = [];
        let table = div.querySelector('table');
        if (table) {
            let tbody = table.querySelector('tbody');
            if (tbody) {
                for (let tr of tbody.querySelectorAll('tr')) {
                    let row = [];
                    for (let td of tr.querySelectorAll('td')) {
                        let inp = td.querySelector('input,textarea,select');
                        row.push(inp ? inp.value : '');
                    }
                    if (row.some(v => v && v !== '')) rows.push(row);
                }
            }
        }
        if (category && rows.length > 0) result.push({ category, rows });
    });
    return result;
}