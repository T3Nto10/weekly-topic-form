// ==================== 动态表格操作模块 ====================

/**
 * 通用：为指定表格添加一行（带删除按钮）
 * @param {string} tbodyId - tbody 的 ID
 * @param {number} colCount - 列数（包含操作列）
 */
function addRowWithDelete(tbodyId, colCount) {
    let tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    // 如果表格只有一行提示文字，先清空
    if (tbody.children.length === 1 && tbody.children[0].innerText.includes('点击下方按钮')) {
        tbody.innerHTML = '';
    }
    
    let newRow = tbody.insertRow();
    // 添加数据列（colCount - 1 列用于输入）
    for (let i = 0; i < colCount - 1; i++) {
        newRow.insertCell(i).innerHTML = '<input style="width:100%" placeholder="请输入">';
    }
    // 添加操作列（删除按钮）
    let delCell = newRow.insertCell(colCount - 1);
    let delBtn = document.createElement('button');
    delBtn.innerText = '删除';
    delBtn.style.background = '#fde2e2';
    delBtn.style.border = 'none';
    delBtn.style.padding = '2px 10px';
    delBtn.style.borderRadius = '12px';
    delBtn.style.cursor = 'pointer';
    delBtn.onclick = () => newRow.remove();
    delCell.appendChild(delBtn);
}

/**
 * 议题三：机制流程 - 添加事项行
 */
function addComplianceRow() {
    addRowWithDelete('complianceTbody', 5);  // 事项、计划说明、负责人、完成时间、操作
}

/**
 * 议题五：共同决策 - 添加决策行
 */
function addDecisionRow() {
    addRowWithDelete('decisionTbody', 4);  // 决策事项、背景/选项逻辑、建议方案、操作
}

/**
 * 议题六：其他 - 添加事项行
 */
function addOtherRow() {
    addRowWithDelete('otherTbody', 5);  // 事项、说明、建议、提出人、操作
}

/**
 * 删除整个动态分类（用于组织人才和具体业务的动态分类）
 * @param {HTMLElement} btn - 点击的删除按钮
 */
function deleteDynamicCategory(btn) {
    if (confirm('确定删除整个小类吗？')) {
        let wrapper = btn.closest('.dynamic-category-wrapper');
        if (wrapper) wrapper.remove();
    }
}

/**
 * 议题二：组织人才与能力建设 - 添加动态分类
 */
function addOrgRow() {
    let category = document.getElementById('orgCategorySelect').value;
    let container = document.getElementById('orgTablesContainer');
    
    let wrapper = document.createElement('div');
    wrapper.className = 'dynamic-category-wrapper';
    wrapper.style.marginBottom = '20px';
    wrapper.style.border = '1px solid #e2e8f0';
    wrapper.style.borderRadius = '12px';
    wrapper.style.padding = '10px';
    wrapper.style.background = '#fefefe';
    
    let titleSpan = document.createElement('div');
    titleSpan.style.fontWeight = '600';
    titleSpan.style.marginBottom = '8px';
    titleSpan.style.display = 'flex';
    titleSpan.style.justifyContent = 'space-between';
    titleSpan.innerHTML = `<span> ${category}</span><button class="btn-danger-icon" onclick="deleteDynamicCategory(this)">❌ 删除本小类</button>`;
    wrapper.appendChild(titleSpan);
    
    let table = document.createElement('table');
    table.style.width = '100%';
    let thead = document.createElement('thead');
    
    // 根据不同分类定义不同的表头
    if (category === '招聘工作') {
        thead.innerHTML = '<tr><th>团队</th><th>考勤/非考勤编制需求</th><th>已入职</th><th>待入职(日期)</th><th>面试中</th><th>卡点说明</th></tr>';
    } else if (category === '离职情况') {
        thead.innerHTML = '<tr><th>团队</th><th>离职人数</th><th>姓名</th><th>离职原因</th><th>是否B+及以上</th><th>改进措施</th></tr>';
    } else if (category === '培训培养') {
        thead.innerHTML = '<tr><th>团队</th><th>培训次数</th><th>培训类型</th><th>培训主题</th><th>参训人数</th></tr>';
    } else if (category === '述职提醒') {
        thead.innerHTML = '<tr><th>团队</th><th>转正人数</th><th>姓名</th><th>转正日期</th><th>计划述职日期</th></tr>';
    } else if (category === '能力建设') {
        thead.innerHTML = '<tr><th>技术/事项</th><th>进展状态</th><th>说明</th><th>负责人</th></tr>';
    } else {
        // 文化建设
        thead.innerHTML = '<tr><th>传达主题</th><th>精神/要点内容</th><th>传达人</th><th>传达日期</th></tr>';
    }
    table.appendChild(thead);
    
    let tbody = document.createElement('tbody');
    let colCount = thead.querySelectorAll('th').length;
    let row = tbody.insertRow();
    for (let i = 0; i < colCount; i++) {
        row.insertCell(i).innerHTML = '<input style="width:100%" placeholder="请输入">';
    }
    table.appendChild(tbody);
    wrapper.appendChild(table);
    
    let addRowBtn = document.createElement('button');
    addRowBtn.innerText = '+ 添加本小类行';
    addRowBtn.style.cssText = 'font-size:0.7rem;background:#eef3fc;border:none;padding:4px 12px;border-radius:16px;cursor:pointer;margin-top:8px';
    addRowBtn.onclick = () => {
        let tb = table.querySelector('tbody');
        if (tb) {
            let nr = tb.insertRow();
            for (let i = 0; i < colCount; i++) {
                nr.insertCell(i).innerHTML = '<input style="width:100%" placeholder="请输入">';
            }
        }
    };
    wrapper.appendChild(addRowBtn);
    container.appendChild(wrapper);
}

/**
 * 议题四：具体业务 - 添加动态分类
 */
function addBizRow() {
    let category = document.getElementById('bizCategorySelect').value;
    let container = document.getElementById('bizTablesContainer');
    
    let wrapper = document.createElement('div');
    wrapper.className = 'dynamic-category-wrapper';
    wrapper.style.marginBottom = '20px';
    wrapper.style.border = '1px solid #e2e8f0';
    wrapper.style.borderRadius = '12px';
    wrapper.style.padding = '10px';
    
    let titleSpan = document.createElement('div');
    titleSpan.style.fontWeight = '600';
    titleSpan.style.marginBottom = '8px';
    titleSpan.style.display = 'flex';
    titleSpan.style.justifyContent = 'space-between';
    titleSpan.innerHTML = `<span> ${category}</span><button class="btn-danger-icon" onclick="deleteDynamicCategory(this)">❌ 删除本小类</button>`;
    wrapper.appendChild(titleSpan);
    
    let table = document.createElement('table');
    table.style.width = '100%';
    let thead = document.createElement('thead');
    
    // 根据不同分类定义不同的表头
    if (category === '已有项目评审') {
        thead.innerHTML = '<tr><th>项目名称</th><th>阶段</th><th>进度%</th><th>本周进展</th><th>风险/问题</th><th>风险等级</th></tr>';
    } else if (category === '项目完结总结') {
        thead.innerHTML = '<tr><th>项目名称</th><th>复盘结论</th><th>资源释放情况</th><th>经验教训</th></tr>';
    } else {
        // 新项目分析与立项
        thead.innerHTML = '<tr><th>新项目名称</th><th>需求分析</th><th>资源需求评估</th><th>负责人</th></tr>';
    }
    table.appendChild(thead);
    
    let tbody = document.createElement('tbody');
    let colCount = thead.querySelectorAll('th').length;
    let row = tbody.insertRow();
    for (let i = 0; i < colCount; i++) {
        row.insertCell(i).innerHTML = '<input style="width:100%" placeholder="请输入">';
    }
    table.appendChild(tbody);
    wrapper.appendChild(table);
    
    let addRowBtn = document.createElement('button');
    addRowBtn.innerText = '+ 添加本小类行';
    addRowBtn.style.cssText = 'font-size:0.7rem;background:#eef3fc;border:none;padding:4px 12px;border-radius:16px;cursor:pointer;margin-top:8px';
    addRowBtn.onclick = () => {
        let tb = table.querySelector('tbody');
        if (tb) {
            let nr = tb.insertRow();
            for (let i = 0; i < colCount; i++) {
                nr.insertCell(i).innerHTML = '<input style="width:100%" placeholder="请输入">';
            }
        }
    };
    wrapper.appendChild(addRowBtn);
    container.appendChild(wrapper);
}