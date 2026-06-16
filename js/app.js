// ==================== 主应用模块 ====================

/**
 * 切换三种模式（会议纪要 / 填写模式 / 议题看板）
 * @param {string} mode - 模式名称：'admin', 'fill', 'dashboard'
 */
function switchMode(mode) {
    const adminPanel = document.getElementById('adminPanel');
    const fillPanel = document.getElementById('fillPanel');
    const dashboardPanel = document.getElementById('dashboardPanel');
    const btns = document.querySelectorAll('.mode-btn');
    
    // 移除所有激活状态
    btns.forEach(btn => btn.classList.remove('active'));
    adminPanel.classList.remove('active');
    fillPanel.classList.remove('active');
    dashboardPanel.classList.remove('active');
    
    // 激活对应模式
    if (mode === 'admin') {
        adminPanel.classList.add('active');
        btns[0]?.classList.add('active');
        renderAdminTables();
        renderMeetingMinutes();
    } else if (mode === 'fill') {
        fillPanel.classList.add('active');
        btns[1]?.classList.add('active');
        updatePersonSelect();
    } else if (mode === 'dashboard') {
        dashboardPanel.classList.add('active');
        btns[2]?.classList.add('active');
        renderDashboard();
    }
}

/**
 * 初始化所有模板内容（将 templates.js 中的内容渲染到页面）
 */
function initTemplates() {
    if (typeof templates === 'undefined') {
        console.warn('templates.js 未加载');
        return;
    }
    
    const templateMap = {
        'template_task': templates.task,
        'template_org': templates.organization,
        'template_process': templates.compliance,
        'template_project': templates.business,
        'template_decision': templates.decision,
        'template_other': templates.other
    };
    
    for (const [elementId, template] of Object.entries(templateMap)) {
        const elem = document.getElementById(elementId);
        if (elem && template) {
            // 将换行符 \n 替换为 <br> 标签
            elem.innerHTML = template.template.replace(/\n/g, '<br>');
        }
    }
}

/**
 * 全局初始化函数（在 DOM 加载完成后调用）
 */
function initApp() {
    initWeekDisplay();      // 初始化周次显示
    initTemplates();        // 初始化模板内容
    renderAdminTables();    // 渲染任务库表格
    renderMeetingMinutes(); // 渲染会议纪要
    updatePersonSelect();   // 更新人员下拉框
}