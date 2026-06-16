// ==================== 会议纪要与任务库管理模块 ====================

/**
 * 渲染会议纪要卡片
 */
function renderMeetingMinutes() {
    if (!meetingMinutes) return;
    
    // 设置标题
    const meetingTitleSpan = document.getElementById('meetingMinutesTitle');
    if (meetingTitleSpan) {
        meetingTitleSpan.innerText = `${meetingMinutes.week} 会议纪要（点击展开）`;
    }
    
    // 渲染会议信息
    const infoPanel = document.getElementById('meetingInfoPanel');
    if (infoPanel) {
        infoPanel.innerHTML = `
            <div class="meeting-info-item"><span class="meeting-info-label">周次：</span>${meetingMinutes.week}</div>
            <div class="meeting-info-item"><span class="meeting-info-label">日期范围：</span>${meetingMinutes.dateRange || meetingMinutes.week}</div>
            <div class="meeting-info-item"><span class="meeting-info-label">会议日期：</span>${meetingMinutes.meetingDate}</div>
            <div class="meeting-info-item"><span class="meeting-info-label">地点：</span>${meetingMinutes.location}</div>
            <div class="meeting-info-item"><span class="meeting-info-label">主持人：</span>${meetingMinutes.host}</div>
            <div class="meeting-info-item"><span class="meeting-info-label">参会人：</span>${meetingMinutes.attendees}</div>
            <div class="meeting-info-item"><span class="meeting-info-label">密级：</span>${meetingMinutes.classification}</div>
        `;
    }
    
    // 渲染议题列表
    const topicsPanel = document.getElementById('meetingTopicsPanel');
    const topicCountSpan = document.getElementById('topicCount');
    if (topicsPanel && meetingMinutes.topics) {
        if (topicCountSpan) topicCountSpan.innerText = meetingMinutes.topics.length;
        topicsPanel.innerHTML = meetingMinutes.topics.map(topic => `
            <div class="meeting-topic">
                <div class="meeting-topic-badge">${topic.badge}</div>
                <div class="meeting-topic-title">${topic.number}. ${topic.title}</div>
                <div class="meeting-topic-desc">${topic.description}</div>
                <div class="meeting-topic-meta">
                    <span>👤 负责人：${topic.owner}</span>
                    <span>⏰ 预计完成：${topic.deadline}</span>
                    <span>${topic.status}</span>
                </div>
            </div>
        `).join('');
    }
    
    // 渲染主要决策
    const decisionsPanel = document.getElementById('meetingDecisionsPanel');
    if (decisionsPanel && meetingMinutes.decisions) {
        decisionsPanel.innerHTML = meetingMinutes.decisions.map(d => `<div style="margin:6px 0;">• ${d}</div>`).join('');
    }
    
    // 渲染主要风险
    const risksPanel = document.getElementById('meetingRisksPanel');
    if (risksPanel && meetingMinutes.risks) {
        risksPanel.innerHTML = meetingMinutes.risks.map(risk => `
            <div style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:10px; margin-bottom:8px; font-size:0.75rem;">
                <div style="font-weight:700; color:#1e4663;">🚨 ${risk.risk}</div>
                <div style="margin:4px 0; color:#5c6f87;">影响：${risk.impact}</div>
                <div style="margin:4px 0; color:#c0392b;">等级：${risk.level}</div>
                <div style="margin:4px 0; color:#5c6f87;">应对：${risk.mitigation}</div>
            </div>
        `).join('');
    }
}

/**
 * 展开/收起会议纪要
 */
function toggleMeetingMinutes() {
    const content = document.getElementById('meetingContent');
    const icon = document.querySelector('.meeting-toggle-icon');
    if (content) {
        content.classList.toggle('show');
        if (icon) icon.classList.toggle('collapsed');
    }
}

/**
 * 渲染任务库表格（按人员分组，只读模式）
 */
function renderAdminTables() {
    const container = document.getElementById('taskTablesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let [person, tasks] of Object.entries(taskLibrary)) {
        if (tasks.length === 0) continue;
        
        let card = document.createElement('div');
        card.style.marginBottom = '20px';
        card.style.border = '1px solid #dce5ec';
        card.style.borderRadius = '16px';
        card.style.padding = '14px';
        card.style.background = '#fafcff';
        
        let title = document.createElement('div');
        title.style.fontWeight = '700';
        title.style.borderLeft = '3px solid #2c6e9e';
        title.style.paddingLeft = '10px';
        title.style.marginBottom = '12px';
        title.innerText = `👤 ${person}`;
        card.appendChild(title);
        
        let table = document.createElement('table');
        table.style.width = '100%';
        table.style.fontSize = '0.75rem';
        
        let thead = document.createElement('thead');
        thead.innerHTML = `<tr><th style="text-align:left">任务描述</th><th style="width:80px">提出周次</th><th style="width:80px">预计完成时间</th></tr>`;
        table.appendChild(thead);
        
        let tbody = document.createElement('tbody');
        tasks.forEach(t => {
            let row = tbody.insertRow();
            let td1 = row.insertCell(0);
            td1.innerText = t.task;
            td1.style.border = '1px solid #e2e8f0';
            td1.style.padding = '8px';
            let td2 = row.insertCell(1);
            td2.innerText = t.proposeWeek;
            td2.style.border = '1px solid #e2e8f0';
            td2.style.padding = '8px';
            let td3 = row.insertCell(2);
            td3.innerText = t.deadline;
            td3.style.border = '1px solid #e2e8f0';
            td3.style.padding = '8px';
        });
        table.appendChild(tbody);
        card.appendChild(table);
        container.appendChild(card);
    }
}