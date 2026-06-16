// ==================== 周次计算工具模块 ====================

/**
 * 获取指定日期的周数（ISO周数标准）
 * @param {Date} date - 日期对象
 * @returns {number} 周数
 */
function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

/**
 * 获取当前日期的周数
 * @returns {number} 当前周数
 */
function getCurrentWeekNumber() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

/**
 * 获取指定日期所在周的起止文本（格式：W24 (6/8-6/14)）
 * @param {Date} date - 日期对象
 * @returns {string} 周次文本
 */
function getWeekRangeText(date) {
    const day = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const formatDate = d => `${d.getMonth() + 1}/${d.getDate()}`;
    return `W${getWeekNumber(date)} (${formatDate(monday)}-${formatDate(sunday)})`;
}

/**
 * 获取当前周次显示文本
 * @returns {string} 当前周次文本
 */
function getCurrentWeekRangeText() {
    return getWeekRangeText(new Date());
}

/**
 * 获取上周周次显示文本（用于任务库显示）
 * @returns {string} 上周周次文本
 */
function getLastWeekRangeText() {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return getWeekRangeText(date);
}

/**
 * 初始化页面中的周次显示
 * 设置填写模式的周次输入框、管理模式的说明文字、看板模式的周次标签
 */
function initWeekDisplay() {
    const currentWeek = getCurrentWeekRangeText();
    const lastWeek = getLastWeekRangeText();
    
    // 填写模式：显示当前周次
    const fillWeekInput = document.getElementById('fillWeek');
    if (fillWeekInput) {
        fillWeekInput.value = currentWeek;
    }
    
    // 管理模式：显示说明文字（任务来源于上周）
    const adminDescText = document.getElementById('adminDescText');
    if (adminDescText) {
        adminDescText.innerText = `以下任务来源于上周（${lastWeek}）周会「下一步行动计划」，需在本周（${currentWeek}）跟进闭环`;
    }
    
    // 看板模式：显示当前周次
    const dashboardWeekLabel = document.getElementById('dashboardWeekLabel');
    if (dashboardWeekLabel) {
        dashboardWeekLabel.innerText = currentWeek;
    }
}