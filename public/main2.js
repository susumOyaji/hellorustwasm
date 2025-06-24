// main.js

// WASMモジュールを直接インポートする代わりに、APIエンドポイントを呼び出すため、
// wasm変数の定義は不要になります
// let wasm;

// Initialize the application (API呼び出しに特化)
async function init() {
    try {
        document.getElementById('loading').style.display = 'block';

        // WASMモジュールの直接ロードは削除
        console.log('Initializing application. Pages Functions will be called via API.');
        
        document.getElementById('loading').style.display = 'none';
        
        setupEventListeners();
        displayMessage('Ready! Pages Functions will handle requests.', 'hello-output', 'success');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').classList.remove('hidden');
        
        console.log('Creating fallback demo functions...');
        setupFallbackDemo(); // フォールバックは残しておくと便利
    }
}

// Setup event listeners for all demo buttons
function setupEventListeners() {
    // Hello World button
    document.getElementById('hello-btn').addEventListener('click', async () => {
        try {
            displayMessage('Calling /api/hello-world...', 'hello-output', 'info');
            const response = await fetch('/api/hello-world');
            const message = await response.text(); // テキストレスポンスを想定
            displayMessage(message, 'hello-output', 'success');
        } catch (error) {
            displayMessage(`Error calling API: ${error.message}`, 'hello-output', 'error');
        }
    });

    // Greet button
    document.getElementById('greet-btn').addEventListener('click', async () => {
        try {
            const name = document.getElementById('name-input').value || 'World';
            displayMessage(`Calling /api/greet?name=${name}...`, 'greet-output', 'info');
            const response = await fetch(`/api/greet?name=${encodeURIComponent(name)}`);
            const message = await response.text();
            displayMessage(message, 'greet-output', 'success');
        } catch (error) {
            displayMessage(`Error calling API: ${error.message}`, 'greet-output', 'error');
        }
    });

    // Add button
    document.getElementById('add-btn').addEventListener('click', async () => {
        try {
            const num1 = parseInt(document.getElementById('num1').value) || 0;
            const num2 = parseInt(document.getElementById('num2').value) || 0;
            displayMessage(`Calling /api/add?num1=${num1}&num2=${num2}...`, 'calc-output', 'info');
            const response = await fetch(`/api/add?num1=${num1}&num2=${num2}`);
            const result = await response.text(); // 数値が文字列として返されることを想定
            displayMessage(`${num1} + ${num2} = ${result}`, 'calc-output', 'success');
        } catch (error) {
            displayMessage(`Error calling API: ${error.message}`, 'calc-output', 'error');
        }
    });

    // Timestamp button
    document.getElementById('timestamp-btn').addEventListener('click', async () => {
        try {
            displayMessage('Calling /api/timestamp...', 'timestamp-output', 'info');
            const response = await fetch('/api/timestamp');
            const timestamp = await response.text(); // タイムスタンプが文字列として返されることを想定
            const date = new Date(parseInt(timestamp)); // 数値に変換
            displayMessage(`Timestamp: ${timestamp}<br>Date: ${date.toLocaleString()}`, 'timestamp-output', 'success');
        } catch (error) {
            displayMessage(`Error calling API: ${error.message}`, 'timestamp-output', 'error');
        }
    });

    // Yahoo homepage button (既存のコードと同じ)
    document.getElementById('load-yahoo-btn').addEventListener('click', async () => {
        try {
            displayMessage('Loading Yahoo homepage...', 'yahoo-output', 'info');
            const response = await fetch('/api/proxy/yahoo');
            const data = await response.json();
            
            if (response.ok && data.success) { // レスポンスがOKかつ成功フラグがあれば
                displayMessage('Yahoo homepage loaded successfully', 'yahoo-output', 'success');
                document.getElementById('yahoo-content').innerHTML = data.content;
            } else {
                displayMessage(`Error: ${data.error || 'Unknown error'}`, 'yahoo-output', 'error');
                document.getElementById('yahoo-content').innerHTML = data.content || '';
            }
        } catch (error) {
            displayMessage(`Failed to load Yahoo homepage: ${error.message}`, 'yahoo-output', 'error');
            document.getElementById('yahoo-content').innerHTML = '';
        }
    });

    // Yahoo news button (既存のコードと同じ)
    document.getElementById('load-news-btn').addEventListener('click', async () => {
        try {
            displayMessage('Loading Yahoo news...', 'yahoo-output', 'info');
            const response = await fetch('/api/proxy/yahoo/news');
            const data = await response.json();
            
            if (response.ok && data.success && data.articles && data.articles.length > 0) {
                displayMessage(`Loaded ${data.articles.length} news articles`, 'yahoo-output', 'success');
                
                const newsHtml = `
                    <div class="news-container">
                        <h3>Yahoo News Headlines</h3>
                        <ul class="news-list">
                            ${data.articles.map(article => 
                                `<li><a href="${article.url}" target="_blank">${article.title}</a></li>`
                            ).join('')}
                        </ul>
                    </div>
                `;
                document.getElementById('yahoo-content').innerHTML = newsHtml;
            } else {
                displayMessage('No news articles found or error occurred', 'yahoo-output', 'warning');
                document.getElementById('yahoo-content').innerHTML = '';
            }
        } catch (error) {
            displayMessage(`Failed to load Yahoo news: ${error.message}`, 'yahoo-output', 'error');
            document.getElementById('yahoo-content').innerHTML = '';
        }
    });

    // Open Yahoo in new tab button (既存のコードと同じ)
    document.getElementById('open-yahoo-tab-btn').addEventListener('click', () => {
        try {
            const yahooWindow = window.open('https://www.yahoo.co.jp/', '_blank', 'noopener,noreferrer');
            if (yahooWindow) {
                displayMessage('Yahoo homepage opened in new tab', 'yahoo-output', 'success');
            } else {
                displayMessage('Popup blocked - please allow popups for this site', 'yahoo-output', 'warning');
            }
        } catch (error) {
            displayMessage(`Failed to open Yahoo: ${error.message}`, 'yahoo-output', 'error');
        }
    });

    // Open Yahoo News in new tab button (既存のコードと同じ)
    document.getElementById('open-yahoo-news-tab-btn').addEventListener('click', () => {
        try {
            const yahooNewsWindow = window.open('https://news.yahoo.com', '_blank', 'noopener,noreferrer');
            if (yahooNewsWindow) {
                displayMessage('Yahoo News opened in new tab', 'yahoo-output', 'success');
            } else {
                displayMessage('Popup blocked - please allow popups for this site', 'yahoo-output', 'warning');
            }
        } catch (error) {
            displayMessage(`Failed to open Yahoo News: ${error.message}`, 'yahoo-output', 'error');
        }
    });
}

// Setup fallback demo functions (WASMロードではなくAPI呼び出しのフォールバック)
function setupFallbackDemo() {
    // API呼び出し自体が失敗した場合のフォールバックは、displayMessageにエラーを表示する形になります。
    // ここでは、WASM直接ロードの失敗という概念自体がなくなるため、フォールバックの役割は限定的です。
    // 必要であれば、ボタンを無効化するなどの処理を追加できます。
    console.warn('WASM direct loading is not used. Please check API endpoints if issues persist.');
    // 例えば、ボタンを全て無効化する
    document.querySelectorAll('button').forEach(btn => btn.disabled = true);
    displayMessage('Application initialized without full functionality (check console for API errors).', 'hello-output', 'error');
}

// Utility function to display messages (変更なし)
function displayMessage(message, elementId, type = 'info') {
    const element = document.getElementById(elementId);
    element.innerHTML = message;
    element.className = `output ${type}`;
    
    // Auto-clear after 10 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            if (element.innerHTML === message) {
                element.innerHTML = '';
                element.className = 'output';
            }
        }, 10000);
    }
}

// Handle errors globally (変更なし)
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Initialize the application
init();