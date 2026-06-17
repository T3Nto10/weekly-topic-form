// ==================== 数据导入模块 ====================

function showImportDialog() {
    const existing = document.getElementById('importDialog');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'importDialog';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    
    overlay.innerHTML = `
        <div style="
            background: white;
            border-radius: 16px;
            padding: 30px;
            max-width: 750px;
            width: 95%;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
            <h2 style="margin-top: 0;">📥 导入智能表格数据</h2>
            <p style="color: #e74c3c; font-size: 14px; background: #fde8e8; padding: 8px 12px; border-radius: 6px;">
                ⚠️ 请确保复制时包含了 <strong>表头行</strong>
            </p>
            <textarea id="importTextArea" style="
                width: 100%;
                height: 200px;
                border: 2px solid #ccc;
                border-radius: 8px;
                padding: 12px;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                resize: vertical;
                box-sizing: border-box;
                line-height: 1.8;
            " placeholder="请在此粘贴从智能表格复制的数据..."></textarea>
            <div style="margin-top: 12px; display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">
                <button onclick="closeImportDialog()" style="
                    padding: 8px 24px;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                ">取消</button>
                <button onclick="doImport()" style="
                    padding: 8px 24px;
                    border: none;
                    border-radius: 8px;
                    background: #2c6e9e;
                    color: white;
                    cursor: pointer;
                ">📥 导入数据</button>
            </div>
            <div id="importStatus" style="margin-top: 12px; font-size: 14px;"></div>
            <div id="importDetail" style="margin-top: 8px; font-size: 13px; color: #666; max-height: 150px; overflow-y: auto;"></div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

function closeImportDialog() {
    const dialog = document.getElementById('importDialog');
    if (dialog) dialog.remove();
}

function doImport() {
    const textarea = document.getElementById('importTextArea');
    const status = document.getElementById('importStatus');
    const detail = document.getElementById('importDetail');
    
    if (!textarea) {
        alert('❌ 找不到输入框，请重新打开导入对话框');
        return;
    }
    
    const text = textarea.value;
    
    if (!text.trim()) {
        if (status) {
            status.innerHTML = '⚠️ 请粘贴要导入的数据';
            status.style.color = '#e74c3c';
        }
        return;
    }
    
    try {
        const newData = parseSmartSheetData(text);
        if (!newData) {
            if (status) {
                status.innerHTML = '❌ 数据解析失败，请检查格式是否正确';
                status.style.color = '#e74c3c';
            }
            return;
        }
        
        const counts = {
            task: newData.task_closed.length,
            org: newData.org_dynamic.reduce((sum, cat) => sum + cat.rows.length, 0),
            compliance: newData.compliance.length,
            biz: newData.biz_dynamic.reduce((sum, cat) => sum + cat.rows.length, 0),
            decision: newData.decision.length,
            other: newData.other.length
        };
        const total = counts.task + counts.org + counts.compliance + counts.biz + counts.decision + counts.other;
        
        if (detail) {
            let detailHtml = `<strong>📊 解析结果：共 ${total} 条数据</strong><br>`;
            if (counts.task > 0) detailHtml += `• 任务闭环：${counts.task} 条<br>`;
            if (counts.org > 0) detailHtml += `• 组织人才：${counts.org} 条<br>`;
            if (counts.compliance > 0) detailHtml += `• 机制流程：${counts.compliance} 条<br>`;
            if (counts.biz > 0) detailHtml += `• 具体业务：${counts.biz} 条<br>`;
            if (counts.decision > 0) detailHtml += `• 共同决策：${counts.decision} 条<br>`;
            if (counts.other > 0) detailHtml += `• 其他：${counts.other} 条<br>`;
            detail.innerHTML = detailHtml;
        }
        
        if (status) {
            status.innerHTML = `✅ 解析成功！共 ${total} 条数据`;
            status.style.color = '#27ae60';
        }
        
        if (total === 0) {
            if (status) {
                status.innerHTML = '⚠️ 没有解析到任何数据，请检查格式';
                status.style.color = '#e74c3c';
            }
            return;
        }
        
        if (confirm(`确认导入 ${total} 条数据到看板吗？\n（将覆盖当前看板数据）`)) {
            dashboardData.task_closed = newData.task_closed;
            dashboardData.org_dynamic = newData.org_dynamic;
            dashboardData.compliance = newData.compliance;
            dashboardData.biz_dynamic = newData.biz_dynamic;
            dashboardData.decision = newData.decision;
            dashboardData.other = newData.other;
            dashboardData.meta = newData.meta;
            
            if (typeof renderDashboard === 'function') {
                renderDashboard();
            }
            
            if (status) {
                status.innerHTML = '✅ 数据已成功导入并渲染看板！';
                status.style.color = '#27ae60';
            }
            
            setTimeout(() => {
                closeImportDialog();
            }, 1500);
        }
        
    } catch (e) {
        console.error('导入错误:', e);
        if (status) {
            status.innerHTML = `❌ 导入失败：${e.message}`;
            status.style.color = '#e74c3c';
        }
    }
}

function parseSmartSheetData(text) {
    // 按行分割
    let lines = text.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
        alert('⚠️ 数据为空');
        return null;
    }
    
    console.log('📋 === 开始解析 ===');
    console.log('📋 总行数:', lines.length);
    console.log('📋 第一行原始内容:', JSON.stringify(lines[0]));
    
    // 检测分隔符 - 优先 Tab
    let separator = '\t';
    if (!lines[0].includes('\t')) {
        if (lines[0].includes(',')) {
            separator = ',';
            console.log('📋 使用逗号分隔');
        } else {
            separator = /\s{2,}/;
            console.log('📋 使用多个空格分隔');
        }
    } else {
        console.log('📋 使用 Tab 分隔');
    }
    
    // 解析表头
    let headers;
    if (typeof separator === 'string') {
        headers = lines[0].split(separator).map(h => h.trim());
    } else {
        headers = lines[0].split(separator).map(h => h.trim());
    }
    // 过滤空表头
    headers = headers.filter(h => h !== '');
    console.log('📋 表头:', headers);
    console.log('📋 表头列数:', headers.length);
    
    // 解析数据行
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        let cols;
        if (typeof separator === 'string') {
            cols = lines[i].split(separator).map(c => c.trim());
        } else {
            cols = lines[i].split(separator).map(c => c.trim());
        }
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = cols[idx] || '';
        });
        rows.push(row);
        console.log(`📝 行${i}:`, row);
    }
    
    console.log('📊 解析到', rows.length, '行数据');
    return convertToDashboardData(rows);
}

function convertToDashboardData(rows) {
    const newData = {
        meta: {
            week: getCurrentWeekRangeText(),
            lastUpdated: new Date().toISOString(),
            importedFrom: '智能表格'
        },
        task_closed: [],
        org_dynamic: [],
        compliance: [],
        biz_dynamic: [],
        decision: [],
        other: []
    };
    
    const orgMap = new Map();
    const bizMap = new Map();
    
    rows.forEach((row, index) => {
        // 直接通过索引获取，更可靠
        const values = Object.values(row);
        console.log(`📝 行${index + 1} 所有值:`, values);
        
        // 根据表头位置获取数据
        const headers = Object.keys(row);
        console.log(`📝 行${index + 1} 表头:`, headers);
        
        // 尝试多种方式获取字段
        const date = row['日期'] || values[0] || '';
        const filler = row['填写人'] || values[1] || '';
        const topic = row['议题分类'] || values[2] || '';
        const subTopic = row['子议题'] || values[3] || '';
        const content = row['内容'] || values[4] || '';
        const owner = row['负责人'] || values[5] || filler || '';
        const status = row['状态'] || values[6] || '进行';
        const dateField = row['日期字段'] || values[7] || '';
        const remark = row['备注'] || values[8] || '';
        
        console.log(`  日期: "${date}"`);
        console.log(`  议题分类: "${topic}"`);
        console.log(`  子议题: "${subTopic}"`);
        console.log(`  内容: "${content.substring(0, 50)}..."`);
        console.log(`  状态: "${status}"`);
        
        // 如果没有内容，用所有值拼接
        let finalContent = content;
        if (!finalContent || finalContent === '') {
            const nonEmptyValues = values.filter(v => v && v !== '' && v !== '日期' && v !== '填写人' && v !== '议题分类');
            if (nonEmptyValues.length > 0) {
                finalContent = nonEmptyValues.join(' | ');
                console.log(`  → 内容从其他字段拼接: "${finalContent.substring(0, 50)}..."`);
            }
        }
        
        // 精确匹配议题分类
        let matchedTopic = 'other';
        const topicLower = topic.toLowerCase();
        const contentLower = finalContent ? finalContent.toLowerCase() : '';
        
        if (topic.includes('上周任务闭环') || topic.includes('任务闭环') || topic.includes('任务闭环回顾')) {
            matchedTopic = 'task';
        } else if (topic.includes('组织人才') || topic.includes('组织人才建设')) {
            matchedTopic = 'org';
        } else if (topic.includes('机制流程') || topic.includes('质量合规') || topic.includes('信息安全')) {
            matchedTopic = 'compliance';
        } else if (topic.includes('具体项目') || topic.includes('具体业务') || topic.includes('项目业务')) {
            matchedTopic = 'biz';
        } else if (topic.includes('共同决策')) {
            matchedTopic = 'decision';
        } else {
            // 如果议题分类是空的，尝试从内容识别
            if (finalContent) {
                if (finalContent.includes('|')) {
                    const parts = finalContent.split('|').map(s => s.trim());
                    if (parts.length >= 2) {
                        // 检查是否像项目数据
                        const firstPart = parts[0] || '';
                        const secondPart = parts[1] || '';
                        if (firstPart.includes('项目') || secondPart.includes('调试') || secondPart.includes('发货') || secondPart.includes('阶段')) {
                            matchedTopic = 'biz';
                            console.log('  → 智能识别为具体业务');
                        } else if (firstPart.includes('团队') || firstPart.includes('部门') || secondPart.includes('编制') || secondPart.includes('入职')) {
                            matchedTopic = 'org';
                            console.log('  → 智能识别为组织人才');
                        }
                    }
                }
                // 如果内容包含"风险"、"项目"等关键词，判断为业务
                if (matchedTopic === 'other' && (contentLower.includes('风险') || contentLower.includes('项目') || contentLower.includes('调试'))) {
                    matchedTopic = 'biz';
                    console.log('  → 关键词识别为具体业务');
                }
            }
        }
        
        console.log(`  → 匹配结果: ${matchedTopic}`);
        
        // 根据匹配结果路由
        if (matchedTopic === 'task') {
            let actualStatus = '🟡 进行中';
            let completed = false;
            const statusLower = status.toLowerCase();
            if (statusLower === '完成' || statusLower === '已完成' || statusLower.includes('完成')) {
                actualStatus = '✅ 已完成';
                completed = true;
            } else if (statusLower === '流产' || statusLower === '未完成' || statusLower.includes('未完成')) {
                actualStatus = '🔴 未完成';
                completed = false;
            }
            
            newData.task_closed.push({
                task: finalContent || '未命名任务',
                proposeWeek: extractWeek(date),
                expectDate: dateField || '本周',
                actualStatus: actualStatus,
                statusDetail: remark || '',
                owner: owner || '未指定',
                completed: completed
            });
            console.log('  → ✅ 添加到任务闭环');
            
        } else if (matchedTopic === 'org') {
            const category = subTopic || '招聘工作';
            if (!orgMap.has(category)) {
                orgMap.set(category, { category: category, rows: [] });
            }
            const rowData = parseOrgRow(category, finalContent, owner, dateField, remark);
            orgMap.get(category).rows.push(rowData);
            console.log(`  → ✅ 添加到组织人才: ${category}`);
            
        } else if (matchedTopic === 'compliance') {
            newData.compliance.push({
                '事项': finalContent || '未命名事项',
                '计划说明': remark || '',
                '负责人': owner,
                '完成时间': dateField || ''
            });
            console.log('  → ✅ 添加到机制流程');
            
        } else if (matchedTopic === 'biz') {
            const category = subTopic || '已有项目评审';
            if (!bizMap.has(category)) {
                bizMap.set(category, { category: category, rows: [] });
            }
            const rowData = parseBizRow(category, finalContent, owner, dateField, remark, status);
            bizMap.get(category).rows.push(rowData);
            console.log(`  → ✅ 添加到具体业务: ${category}`);
            
        } else if (matchedTopic === 'decision') {
            newData.decision.push({
                '决策事项': finalContent || '未命名决策',
                '背景选项逻辑': remark || '',
                '建议方案': ''
            });
            console.log('  → ✅ 添加到共同决策');
            
        } else {
            // 其他 - 尝试再次判断
            if (finalContent && finalContent.includes('|') && finalContent.includes('项目')) {
                const category = subTopic || '已有项目评审';
                if (!bizMap.has(category)) {
                    bizMap.set(category, { category: category, rows: [] });
                }
                const rowData = parseBizRow(category, finalContent, owner, dateField, remark, status);
                bizMap.get(category).rows.push(rowData);
                console.log('  → 🔄 二次判断为具体业务');
            } else {
                newData.other.push({
                    '事项': finalContent || subTopic || '未命名事项',
                    '说明': remark || '',
                    '建议': '',
                    '提出人': owner
                });
                console.log('  → ✅ 添加到其他');
            }
        }
    });
    
    newData.org_dynamic = Array.from(orgMap.values());
    newData.biz_dynamic = Array.from(bizMap.values());
    
    console.log('\n✅ 转换完成！');
    console.log('  任务闭环:', newData.task_closed.length);
    console.log('  组织人才:', newData.org_dynamic.length, '个分类');
    newData.org_dynamic.forEach(cat => {
        console.log(`    ${cat.category}: ${cat.rows.length}条`);
    });
    console.log('  机制流程:', newData.compliance.length);
    console.log('  具体业务:', newData.biz_dynamic.length, '个分类');
    newData.biz_dynamic.forEach(cat => {
        console.log(`    ${cat.category}: ${cat.rows.length}条`);
    });
    console.log('  共同决策:', newData.decision.length);
    console.log('  其他:', newData.other.length);
    
    return newData;
}

function parseOrgRow(category, content, owner, dateField, remark) {
    const row = {};
    const parts = content.split('|').map(s => s.trim());
    
    if (category === '招聘工作') {
        row['团队'] = parts[0] || '';
        row['考勤/非考勤编制需求'] = parts[1] || '';
        row['已入职'] = parts[2] || '';
        row['待入职(日期)'] = parts[3] || dateField || '';
        row['面试中'] = parts[4] || '';
        row['卡点说明'] = parts[5] || remark || '';
    } else if (category === '离职情况') {
        row['团队'] = parts[0] || '';
        row['离职人数'] = parts[1] || '';
        row['姓名'] = parts[2] || '';
        row['离职原因'] = parts[3] || '';
        row['是否B+及以上'] = parts[4] || '';
        row['改进措施'] = parts[5] || '';
    } else if (category === '培训培养') {
        row['团队'] = parts[0] || '';
        row['培训次数'] = parts[1] || '';
        row['培训类型'] = parts[2] || '';
        row['培训主题'] = parts[3] || '';
        row['参训人数'] = parts[4] || '';
    } else if (category === '述职提醒') {
        row['团队'] = parts[0] || '';
        row['转正人数'] = parts[1] || '';
        row['姓名'] = parts[2] || '';
        row['转正日期'] = parts[3] || '';
        row['计划述职日期'] = parts[4] || '';
    } else if (category === '能力建设') {
        row['技术/事项'] = parts[0] || '';
        row['进展状态'] = parts[1] || '';
        row['说明'] = parts[2] || '';
        row['负责人'] = parts[3] || owner || '';
    } else {
        row['传达主题'] = parts[0] || '';
        row['精神/要点内容'] = parts[1] || '';
        row['传达人'] = parts[2] || owner || '';
        row['传达日期'] = parts[3] || dateField || '';
    }
    
    if (Object.values(row).every(v => v === '')) {
        const firstKey = Object.keys(row)[0];
        if (firstKey) row[firstKey] = content;
    }
    return row;
}

function parseBizRow(category, content, owner, dateField, remark, status) {
    const row = {};
    const parts = content.split('|').map(s => s.trim());
    
    if (category === '已有项目评审') {
        row['项目名称'] = parts[0] || '';
        row['阶段'] = parts[1] || '';
        row['进度%'] = parts[2] || '';
        row['本周进展'] = parts[3] || '';
        row['风险/问题'] = parts[4] || remark || '';
        row['风险等级'] = parts[5] || status || '';
    } else if (category === '项目完结总结') {
        row['项目名称'] = parts[0] || '';
        row['复盘结论'] = parts[1] || '';
        row['资源释放情况'] = parts[2] || '';
        row['经验教训'] = parts[3] || '';
    } else {
        row['新项目名称'] = parts[0] || '';
        row['需求分析'] = parts[1] || '';
        row['资源需求评估'] = parts[2] || '';
        row['负责人'] = parts[3] || owner || '';
    }
    
    if (Object.values(row).every(v => v === '')) {
        const firstKey = Object.keys(row)[0];
        if (firstKey) row[firstKey] = content;
    }
    return row;
}

function extractWeek(dateStr) {
    if (!dateStr) return getCurrentWeekRangeText();
    try {
        let match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (match) {
            const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
            if (!isNaN(date.getTime())) {
                return getWeekRangeText(date);
            }
        }
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return getWeekRangeText(date);
        }
    } catch (e) {}
    return getCurrentWeekRangeText();
}

function getWeekRangeText(date) {
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const m = String(monday.getMonth() + 1).padStart(2, '0');
    const d = String(monday.getDate()).padStart(2, '0');
    const sm = String(sunday.getMonth() + 1).padStart(2, '0');
    const sd = String(sunday.getDate()).padStart(2, '0');
    return `W${getWeekNumber(date)} (${m}/${d}-${sm}/${sd})`;
}

function getCurrentWeekRangeText() {
    return getWeekRangeText(new Date());
}

function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

