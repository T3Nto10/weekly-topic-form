// ==================== 看板渲染模块（可编辑 + 导出JSON + 提交智能表格） ====================
// ==================== 看板表格样式修复 ====================
// 确保完成情况说明列自动换行

(function injectDashboardStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* 看板表格单元格自动换行 */
        .dashboard-card .editable-table {
            table-layout: fixed;
            width: 100%;
        }
        .dashboard-card .editable-table td.editable-cell {
            word-wrap: break-word;
            white-space: normal;
            max-width: 280px;
            min-width: 80px;
            vertical-align: top;
            padding: 6px 10px;
        }
        /* 完成情况说明列（第5列）更宽 */
        .dashboard-card #dashboardTaskTable td:nth-child(5) {
            max-width: 350px;
            min-width: 150px;
            word-wrap: break-word;
            white-space: normal;
        }
        /* 状态下拉框列紧凑 */
        .dashboard-card #dashboardTaskTable td:nth-child(4) {
            max-width: 120px;
            min-width: 80px;
        }
        .dashboard-card #dashboardTaskTable th,
        .dashboard-card #dashboardTaskTable td {
            overflow: hidden;
        }
        .dashboard-card #dashboardTaskTable td select {
            width: 100%;
            max-width: 110px;
            font-size: 12px;
            padding: 2px 4px;
        }
    `;
    document.head.appendChild(style);
})();
// 全局图表实例变量
let _chartInstance = null;

/**
 * 渲染看板（议题一至议题六）- 可编辑模式
 */
function renderDashboard() {
    const container = document.getElementById('dashboardContainer');
    if (!container) return;
    
    if (!dashboardData) {
        container.innerHTML = '<div class="na-badge">暂无看板数据，请检查 dashboard-data.js 是否加载</div>';
        return;
    }
    
    // 使用自动计算的当前周次
    const weekLabel = getCurrentWeekRangeText();
    const weekLabelElem = document.getElementById('dashboardWeekLabel');
    if (weekLabelElem) weekLabelElem.innerText = weekLabel;
    
    let html = `
        <!-- ====== 看板顶部信息栏（与填写系统保持一致） ====== -->
        <div class="info-bar">
            <div class="info-item">
                <span class="info-label">📊 看板周次：</span>
                <span style="font-weight:600;">${weekLabel}</span>
            </div>
            <div class="info-item">
                <span class="info-label">📝 数据条数：</span>
                <span style="font-weight:600;">${countTotalRecords()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">🔄 最后更新：</span>
                <span style="font-weight:600;">${new Date().toLocaleString('zh-CN')}</span>
            </div>
        </div>
        
        <!-- ====== 编辑提示 ====== -->
        <div class="copy-tip" style="margin-bottom: 16px;">
            <span>✏️</span>
            <span><strong>提示：</strong> 看板中的表格内容可以直接双击编辑，修改后点击右下角「导出JSON」或「提交到智能表格」保存数据。</span>
        </div>
    `;
    
    // ========== 议题一：上周任务闭环回顾 ==========
    const tasks = dashboardData.task_closed || [];
    const totalAll = tasks.length;
    const completedAll = tasks.filter(t => t.completed === true).length;
    const rate = totalAll > 0 ? ((completedAll / totalAll) * 100).toFixed(1) : 0;
    
    // 统计各负责人数据用于图表
    const ownerMap = new Map();
    tasks.forEach(t => {
        if (!ownerMap.has(t.owner)) ownerMap.set(t.owner, { total: 0, completed: 0 });
        let s = ownerMap.get(t.owner);
        s.total++;
        if (t.completed) s.completed++;
    });
    
    html += `<div class="section-title" onclick="toggleTemplate('template_task_dash')">议题一：上周任务闭环回顾 <span class="template-hint">点击查看模板</span></div>
        <div id="template_task_dash" class="template-content">${templates.task.template.replace(/\n/g, '<br>')}</div>`;
    
    if (tasks.length > 0) {
        html += `<div class="chart-card"><div class="chart-row"><div class="chart-box"><canvas id="closureChartCanvas" width="400" height="200" style="max-width:100%"></canvas></div>
        <div class="stats-badge"><div class="stat-item"><div class="stat-num">${completedAll}/${totalAll}</div><div class="stat-label">闭环任务数/总任务数</div></div>
        <div class="stat-item"><div class="stat-num">${rate}%</div><div class="stat-label">整体闭环率</div></div></div></div></div>
        <div class="dashboard-card"><div class="dashboard-title">📋 任务闭环清单</div>
        <table id="dashboardTaskTable" class="editable-table"><thead><tr><th>上周任务</th><th>提出周次</th><th>预计完成时间</th><th>实际完成情况</th><th>完成情况说明</th><th>负责人</th><th style="width:50px">操作</th></tr></thead><tbody>`;
        
        tasks.forEach((t, idx) => {
            html += `<tr data-idx="${idx}">
                <td contenteditable="true" class="editable-cell">${escapeHtml(t.task)}</td>
                <td contenteditable="true" class="editable-cell">${escapeHtml(t.proposeWeek)}</td>
                <td contenteditable="true" class="editable-cell">${escapeHtml(t.expectDate)}</td>
                <td><select class="status-select" data-field="actualStatus" data-idx="${idx}">
                    <option value="✅ 已完成" ${t.actualStatus === '✅ 已完成' ? 'selected' : ''}>✅ 已完成</option>
                    <option value="🔴 未完成" ${t.actualStatus === '🔴 未完成' ? 'selected' : ''}>🔴 未完成</option>
                    <option value="🟡 进行中" ${t.actualStatus === '🟡 进行中' ? 'selected' : ''}>🟡 进行中</option>
                </select></td>
                <td contenteditable="true" class="editable-cell">${escapeHtml(t.statusDetail || '')}</td>
                <td contenteditable="true" class="editable-cell">${escapeHtml(t.owner)}</td>
                <td><button class="btn-danger-icon" onclick="deleteDashboardTask(${idx})">删除</button></td>
            </tr>`;
        });
        html += `</tbody></table>
        <button class="btn btn-secondary btn-sm" style="margin-top: 8px;" onclick="addDashboardTask()">+ 添加任务</button>
        </div>`;
    } else {
        html += `<div class="na-badge">暂无数据，<button class="btn btn-secondary btn-sm" onclick="addDashboardTask()">添加第一条任务</button></div>`;
    }
    
    // ========== 议题二：组织人才与能力建设 ==========
    const orgData = dashboardData.org_dynamic || [];
    html += `<div class="section-title" onclick="toggleTemplate('template_org_dash')">议题二：组织人才与能力建设 <span class="template-hint">点击查看模板</span></div>
        <div id="template_org_dash" class="template-content">${templates.organization.template.replace(/\n/g, '<br>')}</div>`;
    
    if (orgData.length > 0) {
        for (let catIdx = 0; catIdx < orgData.length; catIdx++) {
            const cat = orgData[catIdx];
            if (!cat.rows || cat.rows.length === 0) continue;
            html += `<div class="dashboard-card" data-category-idx="${catIdx}">
                <div class="dashboard-title" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>📌 ${cat.category}</span>
                    <button class="btn-danger-icon" onclick="deleteOrgCategory(${catIdx})">删除分类</button>
                </div>
                <table class="editable-table"><thead><tr>`;
            const firstRow = cat.rows[0];
            const headers = Object.keys(firstRow);
            headers.forEach(h => { html += `<th>${h}</th>`; });
            html += `<th style="width:50px">操作</th></thead><tbody>`;
            
            cat.rows.forEach((row, rowIdx) => {
                html += `<tr data-cat="${catIdx}" data-row="${rowIdx}">`;
                headers.forEach(h => {
                    html += `<td contenteditable="true" class="editable-cell" data-field="${h}">${escapeHtml(row[h] || '')}</td>`;
                });
                html += `<td><button class="btn-danger-icon" onclick="deleteOrgRow(${catIdx}, ${rowIdx})">删除</button></td></tr>`;
            });
            html += `</tbody></table>
            <button class="btn btn-secondary btn-sm" style="margin-top: 8px;" onclick="addOrgRowToDashboard(${catIdx})">+ 添加行</button>
            </div>`;
        }
    }
    html += `<button class="btn btn-secondary" style="margin: 8px 0;" onclick="addOrgCategory()">+ 添加组织人才分类</button>`;
    
    // ========== 议题三：机制流程/信息安全/质量合规 ==========
    const compliance = dashboardData.compliance || [];
    html += `<div class="section-title" onclick="toggleTemplate('template_proc_dash')">议题三：机制流程/信息安全/质量合规 <span class="template-hint">点击查看模板</span></div>
        <div id="template_proc_dash" class="template-content">${templates.compliance.template.replace(/\n/g, '<br>')}</div>
        <div class="dashboard-card"><div class="dashboard-title">📋 机制流程事项</div>
        <table id="dashboardComplianceTable" class="editable-table"><thead><tr><th>事项</th><th>计划说明</th><th>负责人</th><th>完成时间</th><th style="width:50px">操作</th></tr></thead><tbody>`;
    
    compliance.forEach((item, idx) => {
        html += `<tr data-idx="${idx}">
            <td contenteditable="true" class="editable-cell">${escapeHtml(item.事项 || '')}</td>
            <td contenteditable="true" class="editable-cell">${escapeHtml(item.计划说明 || '')}</td>
            <td contenteditable="true" class="editable-cell">${escapeHtml(item.负责人 || '')}</td>
            <td contenteditable="true" class="editable-cell">${escapeHtml(item.完成时间 || '')}</td>
            <td><button class="btn-danger-icon" onclick="deleteComplianceItem(${idx})">删除</button></td>
        </tr>`;
    });
    html += `</tbody></table>
    <button class="btn btn-secondary btn-sm" style="margin-top: 8px;" onclick="addComplianceItem()">+ 添加事项</button>
    </div>`;
    
    // ========== 议题四：具体业务 ==========
    const bizData = dashboardData.biz_dynamic || [];
    html += `<div class="section-title" onclick="toggleTemplate('template_proj_dash')">议题四：具体业务 <span class="template-hint">点击查看模板</span></div>
        <div id="template_proj_dash" class="template-content">${templates.business.template.replace(/\n/g, '<br>')}</div>`;
    
    if (bizData.length > 0) {
        for (let catIdx = 0; catIdx < bizData.length; catIdx++) {
            const cat = bizData[catIdx];
            if (!cat.rows || cat.rows.length === 0) continue;
            html += `<div class="dashboard-card" data-biz-idx="${catIdx}">
                <div class="dashboard-title" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>📌 ${cat.category}</span>
                    <button class="btn-danger-icon" onclick="deleteBizCategory(${catIdx})">删除分类</button>
                </div>
                <table class="editable-table"><thead><tr>`;
            const firstRow = cat.rows[0];
            const headers = Object.keys(firstRow);
            headers.forEach(h => { html += `<th>${h}</th>`; });
            html += `<th style="width:50px">操作</th></thead><tbody>`;
            
            cat.rows.forEach((row, rowIdx) => {
                html += `<tr data-cat="${catIdx}" data-row="${rowIdx}">`;
                headers.forEach(h => {
                    html += `<td contenteditable="true" class="editable-cell" data-field="${h}">${escapeHtml(row[h] || '')}</td>`;
                });
                html += `<td><button class="btn-danger-icon" onclick="deleteBizRow(${catIdx}, ${rowIdx})">删除</button></td></tr>`;
            });
            html += `</tbody></table>
            <button class="btn btn-secondary btn-sm" style="margin-top: 8px;" onclick="addBizRowToDashboard(${catIdx})">+ 添加行</button>
            </div>`;
        }
    }
    html += `<button class="btn btn-secondary" style="margin: 8px 0;" onclick="addBizCategory()">+ 添加具体业务分类</button>`;
    
    // ========== 议题五：共同决策 ==========
    const decisions = dashboardData.decision || [];
    html += `<div class="section-title" onclick="toggleTemplate('template_dec_dash')">议题五：共同决策 <span class="template-hint">点击查看模板</span></div>
        <div id="template_dec_dash" class="template-content">${templates.decision.template.replace(/\n/g, '<br>')}</div>
        <div class="dashboard-card"><div class="dashboard-title">📋 共同决策事项</div>
        <table id="dashboardDecisionTable" class="editable-table"><thead><tr><th>决策事项</th><th>背景/选项逻辑</th><th>建议方案</th><th style="width:50px">操作</th></tr></thead><tbody>`;
    
    decisions.forEach((dec, idx) => {
        html += `<tr data-idx="${idx}">
            <td contenteditable="true" class="editable-cell">${escapeHtml(dec.决策事项 || '')}</td>
            <td contenteditable="true" class="editable-cell">${escapeHtml(dec.背景选项逻辑 || '')}</td>
            <td contenteditable="true" class="editable-cell">${escapeHtml(dec.建议方案 || '')}</td>
            <td><button class="btn-danger-icon" onclick="deleteDecisionItem(${idx})">删除</button></td>
        </tr>`;
    });
    html += `</tbody></table>
    <button class="btn btn-secondary btn-sm" style="margin-top: 8px;" onclick="addDecisionItem()">+ 添加决策项</button>
    </div>`;
    
    // ========== 议题六：其他 ==========
    const others = dashboardData.other || [];
    html += `<div class="section-title" onclick="toggleTemplate('template_other_dash')">议题六：其他 <span class="template-hint">点击查看模板</span></div>
        <div id="template_other_dash" class="template-content">${templates.other.template.replace(/\n/g, '<br>')}</div>
        <div class="dashboard-card"><div class="dashboard-title">📋 其他事项</div>
        <table id="dashboardOtherTable" class="editable-table"><thead><tr><th>事项</th><th>说明</th><th>建议</th><th>提出人</th><th style="width:50px">操作</th></tr></thead><tbody>`;
    
    others.forEach((other, idx) => {
        html += `<tr data-idx="${idx}">
            <td contenteditable="true" class="editable-cell">${escapeHtml(other.事项 || '')}</td>
            <td contenteditable="true" class="editable-cell">${escapeHtml(other.说明 || '')}</td>
            <td contenteditable="true" class="editable-cell">${escapeHtml(other.建议 || '')}</td>
            <td contenteditable="true" class="editable-cell">${escapeHtml(other.提出人 || '')}</td>
            <td><button class="btn-danger-icon" onclick="deleteOtherItem(${idx})">删除</button></td>
        </tr>`;
    });
    html += `</tbody></table>
    <button class="btn btn-secondary btn-sm" style="margin-top: 8px;" onclick="addOtherItem()">+ 添加事项</button>
    </div>`;
    
    // ====== 底部操作按钮 ======
    html += `
        <div class="btn-group">
            <button class="btn btn-secondary" onclick="exportDashboardToJSON()">📥 导出JSON</button>
            <button class="btn btn-secondary" onclick="showImportDialog()" style="background: #27ae60; color: white;">📥 导入数据</button>
            <button class="btn btn-primary" onclick="submitDashboardToSmartSheet()" id="submitDashboardToSheetBtn" style="background: #2c6e9e;">📤 提交到智能表格</button>
        </div>
    `;
    
    container.innerHTML = html;
    
    // 绑定单元格编辑事件（同步到 dashboardData）
    bindEditEvents();
    
    // 渲染图表
    setTimeout(() => {
        renderClosureChart(ownerMap, tasks.length);
    }, 50);
}

/**
 * 统计看板中的数据总条数
 */
function countTotalRecords() {
    let count = 0;
    count += (dashboardData.task_closed || []).length;
    (dashboardData.org_dynamic || []).forEach(cat => { count += (cat.rows || []).length; });
    count += (dashboardData.compliance || []).length;
    (dashboardData.biz_dynamic || []).forEach(cat => { count += (cat.rows || []).length; });
    count += (dashboardData.decision || []).length;
    count += (dashboardData.other || []).length;
    return count;
}

/**
 * HTML转义（防止XSS）
 */
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
        return c;
    });
}

/**
 * 绑定编辑事件，同步到 dashboardData
 */
function bindEditEvents() {
    // 监听所有可编辑单元格的输入事件
    document.querySelectorAll('.editable-cell').forEach(cell => {
        cell.removeEventListener('blur', handleCellEdit);
        cell.addEventListener('blur', handleCellEdit);
    });
    
    // 监听状态下拉框变化
    document.querySelectorAll('.status-select').forEach(select => {
        select.removeEventListener('change', handleStatusChange);
        select.addEventListener('change', handleStatusChange);
    });
}

/**
 * 处理单元格编辑（同步到数据）
 */
function handleCellEdit(e) {
    const cell = e.target;
    const row = cell.closest('tr');
    if (!row) return;
    
    const newValue = cell.innerText.trim();
    const field = cell.getAttribute('data-field');
    
    // 议题一任务表格
    if (row.parentElement?.parentElement?.id === 'dashboardTaskTable') {
        const idx = parseInt(row.getAttribute('data-idx'));
        if (!isNaN(idx) && dashboardData.task_closed[idx]) {
            const colIndex = cell.cellIndex;
            const fields = ['task', 'proposeWeek', 'expectDate', null, 'statusDetail', 'owner'];
            const fieldName = fields[colIndex];
            if (fieldName && fieldName !== null) {
                dashboardData.task_closed[idx][fieldName] = newValue;
                if (fieldName === 'actualStatus') {
                    dashboardData.task_closed[idx].completed = newValue === '✅ 已完成';
                }
            }
        }
    }
    
    // 议题二：组织人才（通过 data-field 定位）
    if (field) {
        const catIdx = parseInt(row.getAttribute('data-cat'));
        const rowIdx = parseInt(row.getAttribute('data-row'));
        if (!isNaN(catIdx) && !isNaN(rowIdx) && dashboardData.org_dynamic[catIdx]?.rows[rowIdx]) {
            dashboardData.org_dynamic[catIdx].rows[rowIdx][field] = newValue;
        }
    }
    
    // 议题四：具体业务
    const bizCatIdx = parseInt(row.getAttribute('data-cat'));
    const bizRowIdx = parseInt(row.getAttribute('data-row'));
    if (!isNaN(bizCatIdx) && !isNaN(bizRowIdx) && field && dashboardData.biz_dynamic[bizCatIdx]?.rows[bizRowIdx]) {
        dashboardData.biz_dynamic[bizCatIdx].rows[bizRowIdx][field] = newValue;
    }
    
    // 议题三、五、六通过表格ID处理
    const tableId = row.parentElement?.parentElement?.id;
    if (tableId === 'dashboardComplianceTable') {
        const idx = parseInt(row.getAttribute('data-idx'));
        if (!isNaN(idx) && dashboardData.compliance[idx]) {
            const fields = ['事项', '计划说明', '负责人', '完成时间'];
            const colIndex = cell.cellIndex;
            if (fields[colIndex]) {
                dashboardData.compliance[idx][fields[colIndex]] = newValue;
            }
        }
    }
    
    if (tableId === 'dashboardDecisionTable') {
        const idx = parseInt(row.getAttribute('data-idx'));
        if (!isNaN(idx) && dashboardData.decision[idx]) {
            const fields = ['决策事项', '背景选项逻辑', '建议方案'];
            const colIndex = cell.cellIndex;
            if (fields[colIndex]) {
                dashboardData.decision[idx][fields[colIndex]] = newValue;
            }
        }
    }
    
    if (tableId === 'dashboardOtherTable') {
        const idx = parseInt(row.getAttribute('data-idx'));
        if (!isNaN(idx) && dashboardData.other[idx]) {
            const fields = ['事项', '说明', '建议', '提出人'];
            const colIndex = cell.cellIndex;
            if (fields[colIndex]) {
                dashboardData.other[idx][fields[colIndex]] = newValue;
            }
        }
    }
}

/**
 * 处理状态下拉框变化
 */
function handleStatusChange(e) {
    const select = e.target;
    const row = select.closest('tr');
    if (!row) return;
    
    const newValue = select.value;
    const idx = parseInt(row.getAttribute('data-idx'));
    if (!isNaN(idx) && dashboardData.task_closed[idx]) {
        dashboardData.task_closed[idx].actualStatus = newValue;
        dashboardData.task_closed[idx].completed = newValue === '✅ 已完成';
    }
}

/**
 * 从看板数据生成智能表格记录
 */
function generateDashboardSmartSheetRecords() {
    const week = getCurrentWeekRangeText();
    const currentTimestamp = Date.now().toString();
    const weekStartTimestamp = getWeekStartTimestamp(week);
    
    const records = [];
    
    // ========== 议题一：任务闭环 ==========
    (dashboardData.task_closed || []).forEach(task => {
        if (!task.task || task.task === '') return;
        
        let statusText = "进行";
        let closedText = "持续中";
        if (task.actualStatus === '✅ 已完成') {
            statusText = "完成";
            closedText = "按时闭环";
        } else if (task.actualStatus === '🔴 未完成') {
            statusText = "流产";
            closedText = "延后闭环";
        }
        
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
            if (record[key] === null || record[key] === undefined) {
                delete record[key];
            }
        });
        records.push(record);
    });
    
    // ========== 议题二：组织人才 ==========
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
                if (record[key] === null || record[key] === undefined) {
                    delete record[key];
                }
            });
            records.push(record);
        });
    });
    
    // ========== 议题三：机制流程 ==========
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
            "fNhjT1": formatSingleSelect("进行"),
            "foplAb": currentTimestamp,
            "flABgk": parseDateToTimestamp(item.完成时间),
            "fT5yC0": item.计划说明 || '',
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
                if (record[key] === null || record[key] === undefined) {
                    delete record[key];
                }
            });
            records.push(record);
        });
    });
    
    // ========== 议题五：共同决策 ==========
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
            if (record[key] === null || record[key] === undefined) {
                delete record[key];
            }
        });
        records.push(record);
    });
    
    // ========== 议题六：其他 ==========
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
            if (record[key] === null || record[key] === undefined) {
                delete record[key];
            }
        });
        records.push(record);
    });
    
    return records;
}

/**
 * 获取周次对应的周一日期时间戳
 */
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

/**
 * 格式化单选字段
 */
function formatSingleSelect(value) {
    if (!value) return null;
    return [{ text: value }];
}

/**
 * 格式化多选字段
 */
function formatMultipleSelect(values) {
    if (!values || values.length === 0) return null;
    const validValues = values.filter(v => v && v !== '');
    if (validValues.length === 0) return null;
    return validValues.map(v => ({ text: v }));
}

/**
 * 解析日期字符串为时间戳
 */
function parseDateToTimestamp(dateStr) {
    if (!dateStr || dateStr === '持续跟进' || dateStr === '本周' || dateStr === '') {
        return null;
    }
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

/**
 * 提交看板数据到智能表格
 */
async function submitDashboardToSmartSheet() {
    console.log('✅ submitDashboardToSmartSheet 被调用了！');
    
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
    
    const result = await batchSubmitToSmartSheet(records);
    
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

/**
 * 导出看板数据为JSON文件
 */
function exportDashboardToJSON() {
    dashboardData.meta = {
        week: getCurrentWeekRangeText(),
        lastUpdated: new Date().toISOString(),
        exportedBy: '看板导出'
    };
    
    const jsonStr = JSON.stringify(dashboardData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_${getCurrentWeekRangeText().replace(/\s/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ 看板数据已导出为JSON文件！');
}

/**
 * 重置看板数据（从原始数据恢复）
 */
function resetDashboardData() {
    if (confirm('⚠️ 重置将丢失所有未保存的修改，确定要重置吗？')) {
        location.reload();
    }
}

// ========== 议题一：任务操作 ==========
function addDashboardTask() {
    const newTask = {
        task: '新任务',
        proposeWeek: getCurrentWeekRangeText(),
        expectDate: '本周',
        actualStatus: '🟡 进行中',
        statusDetail: '',
        owner: '',
        completed: false
    };
    dashboardData.task_closed.push(newTask);
    renderDashboard();
}

function deleteDashboardTask(idx) {
    if (confirm('确定删除这项任务吗？')) {
        dashboardData.task_closed.splice(idx, 1);
        renderDashboard();
    }
}

// ========== 议题二：组织人才操作 ==========
function addOrgCategory() {
    const categoryOptions = ['招聘工作', '离职情况', '培训培养', '述职提醒', '能力建设', '文化建设'];
    const newCategory = prompt('请输入分类名称（建议选择）：\n' + categoryOptions.join('\n'), '招聘工作');
    if (newCategory) {
        let headers = [];
        if (newCategory === '招聘工作') {
            headers = ['团队', '考勤/非考勤编制需求', '已入职', '待入职(日期)', '面试中', '卡点说明'];
        } else if (newCategory === '离职情况') {
            headers = ['团队', '离职人数', '姓名', '离职原因', '是否B+及以上', '改进措施'];
        } else if (newCategory === '培训培养') {
            headers = ['团队', '培训次数', '培训类型', '培训主题', '参训人数'];
        } else if (newCategory === '述职提醒') {
            headers = ['团队', '转正人数', '姓名', '转正日期', '计划述职日期'];
        } else if (newCategory === '能力建设') {
            headers = ['技术/事项', '进展状态', '说明', '负责人'];
        } else {
            headers = ['传达主题', '精神/要点内容', '传达人', '传达日期'];
        }
        const newRow = {};
        headers.forEach(h => { newRow[h] = ''; });
        dashboardData.org_dynamic.push({
            category: newCategory,
            rows: [newRow]
        });
        renderDashboard();
    }
}

function deleteOrgCategory(catIdx) {
    if (confirm(`确定删除分类「${dashboardData.org_dynamic[catIdx]?.category}」吗？`)) {
        dashboardData.org_dynamic.splice(catIdx, 1);
        renderDashboard();
    }
}

function addOrgRowToDashboard(catIdx) {
    const category = dashboardData.org_dynamic[catIdx];
    if (category && category.rows.length > 0) {
        const headers = Object.keys(category.rows[0]);
        const newRow = {};
        headers.forEach(h => { newRow[h] = ''; });
        category.rows.push(newRow);
        renderDashboard();
    }
}

function deleteOrgRow(catIdx, rowIdx) {
    if (confirm('确定删除这行吗？')) {
        dashboardData.org_dynamic[catIdx].rows.splice(rowIdx, 1);
        renderDashboard();
    }
}

// ========== 议题三：机制流程操作 ==========
function addComplianceItem() {
    dashboardData.compliance.push({
        事项: '新事项',
        计划说明: '',
        负责人: '',
        完成时间: ''
    });
    renderDashboard();
}

function deleteComplianceItem(idx) {
    if (confirm('确定删除这项吗？')) {
        dashboardData.compliance.splice(idx, 1);
        renderDashboard();
    }
}

// ========== 议题四：具体业务操作 ==========
function addBizCategory() {
    const categoryOptions = ['已有项目评审', '项目完结总结', '新项目分析与立项'];
    const newCategory = prompt('请输入分类名称（建议选择）：\n' + categoryOptions.join('\n'), '已有项目评审');
    if (newCategory) {
        let headers = [];
        if (newCategory === '已有项目评审') {
            headers = ['项目名称', '阶段', '进度%', '本周进展', '风险/问题', '风险等级'];
        } else if (newCategory === '项目完结总结') {
            headers = ['项目名称', '复盘结论', '资源释放情况', '经验教训'];
        } else {
            headers = ['新项目名称', '需求分析', '资源需求评估', '负责人'];
        }
        const newRow = {};
        headers.forEach(h => { newRow[h] = ''; });
        dashboardData.biz_dynamic.push({
            category: newCategory,
            rows: [newRow]
        });
        renderDashboard();
    }
}

function deleteBizCategory(catIdx) {
    if (confirm(`确定删除分类「${dashboardData.biz_dynamic[catIdx]?.category}」吗？`)) {
        dashboardData.biz_dynamic.splice(catIdx, 1);
        renderDashboard();
    }
}

function addBizRowToDashboard(catIdx) {
    const category = dashboardData.biz_dynamic[catIdx];
    if (category && category.rows.length > 0) {
        const headers = Object.keys(category.rows[0]);
        const newRow = {};
        headers.forEach(h => { newRow[h] = ''; });
        category.rows.push(newRow);
        renderDashboard();
    }
}

function deleteBizRow(catIdx, rowIdx) {
    if (confirm('确定删除这行吗？')) {
        dashboardData.biz_dynamic[catIdx].rows.splice(rowIdx, 1);
        renderDashboard();
    }
}

// ========== 议题五：共同决策操作 ==========
function addDecisionItem() {
    dashboardData.decision.push({
        决策事项: '新决策事项',
        背景选项逻辑: '',
        建议方案: ''
    });
    renderDashboard();
}

function deleteDecisionItem(idx) {
    if (confirm('确定删除这项吗？')) {
        dashboardData.decision.splice(idx, 1);
        renderDashboard();
    }
}

// ========== 议题六：其他操作 ==========
function addOtherItem() {
    dashboardData.other.push({
        事项: '新事项',
        说明: '',
        建议: '',
        提出人: ''
    });
    renderDashboard();
}

function deleteOtherItem(idx) {
    if (confirm('确定删除这项吗？')) {
        dashboardData.other.splice(idx, 1);
        renderDashboard();
    }
}

/**
 * 渲染议题一的闭环率图表
 */
function renderClosureChart(ownerMap, totalTasks) {
    const canvas = document.getElementById('closureChartCanvas');
    if (canvas && typeof Chart !== 'undefined' && totalTasks > 0) {
        if (_chartInstance) _chartInstance.destroy();
        
        let labels = Array.from(ownerMap.keys());
        let completedData = labels.map(l => ownerMap.get(l).completed);
        let totalData = labels.map(l => ownerMap.get(l).total);
        
        _chartInstance = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: '已完成任务数', data: completedData, backgroundColor: '#2c6e9e', borderRadius: 8 },
                    { label: '总任务数', data: totalData, backgroundColor: '#cbdde9', borderRadius: 8 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: { y: { beginAtZero: true, stepSize: 1 } }
            }
        });
    }
}

/**
 * 展开/收起模板内容
 */
function toggleTemplate(id) {
    document.getElementById(id)?.classList.toggle('show');
}