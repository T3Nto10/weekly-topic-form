// ==================== 页面初始化入口 ====================

/**
 * DOM 加载完成后的初始化
 */
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// 将关键函数挂载到 window 对象，确保 HTML 的 onclick 可以调用
window.switchMode = switchMode;
window.toggleTemplate = toggleTemplate;
window.toggleMeetingMinutes = toggleMeetingMinutes;
window.onFillerChange = onFillerChange;
window.addOrgRow = addOrgRow;
window.addBizRow = addBizRow;
window.addComplianceRow = addComplianceRow;
window.addDecisionRow = addDecisionRow;
window.addOtherRow = addOtherRow;
window.deleteDynamicCategory = deleteDynamicCategory;
window.clearFillData = clearFillData;
window.exportFillData = exportFillData;
window.copyReportToClipboard = copyReportToClipboard;
window.submitFillToSmartSheet = submitFillToSmartSheet;
window.submitDashboardToSmartSheet = submitDashboardToSmartSheet;
window.exportDashboardToJSON = exportDashboardToJSON;
window.resetDashboardData = resetDashboardData;

// 看板相关函数（可编辑）
window.exportDashboardToJSON = exportDashboardToJSON;
window.resetDashboardData = resetDashboardData;
window.addDashboardTask = addDashboardTask;
window.deleteDashboardTask = deleteDashboardTask;
window.addOrgCategory = addOrgCategory;
window.deleteOrgCategory = deleteOrgCategory;
window.addOrgRowToDashboard = addOrgRowToDashboard;
window.deleteOrgRow = deleteOrgRow;
window.addComplianceItem = addComplianceItem;
window.deleteComplianceItem = deleteComplianceItem;
window.addBizCategory = addBizCategory;
window.deleteBizCategory = deleteBizCategory;
window.addBizRowToDashboard = addBizRowToDashboard;
window.deleteBizRow = deleteBizRow;
window.addDecisionItem = addDecisionItem;
window.deleteDecisionItem = deleteDecisionItem;
window.addOtherItem = addOtherItem;
window.deleteOtherItem = deleteOtherItem;