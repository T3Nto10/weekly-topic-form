// netlify/functions/webhook.js

// 企微 Webhook 地址（写死在服务器端）
const WEBHOOK_URL = "https://qyapi.weixin.qq.com/cgi-bin/wedoc/smartsheet/webhook?key=6DMSwlWKO6zPmo09M6JRDB2mhuAGu08kS5mdJeeoYZtTe6RYLE3Aw77pHRzmDwU4QcxBJXkD7ZACjILmeRMV7Y6xgOBLz7J7w1U98pp2C8Kb";

exports.handler = async (event, context) => {
    // 处理 OPTIONS 预检请求
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: '',
        };
    }

    // 处理 GET 请求（测试连通性）
    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'text/plain',
            },
            body: 'Netlify Function is alive! 🚀',
        };
    }

    // 只接受 POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        const body = JSON.parse(event.body);

        console.log('📤 转发到企微:', JSON.stringify(body).substring(0, 200));

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const result = await response.json();

        console.log('📥 企微返回:', result);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(result),
        };
    } catch (error) {
        console.error('❌ 错误:', error.message);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ error: error.message }),
        };
    }
};