let wasm;

// Initialize the WebAssembly module
async function init() {
    try {
        // Show loading indicator
        document.getElementById('loading').style.display = 'block';
        
        // Try to import the generated WASM module
        // This assumes wasm-pack has been run with --target web
        try {
            wasm = await import('./pkg/hello_wasm.js');
            await wasm.default();
            console.log('WebAssembly module loaded successfully!');
        } catch (importError) {
            console.warn('WebAssembly module failed to load:', importError.message);
            console.log('Running in fallback mode - stock portfolio features available');
            setupFallbackDemo();
            
            // Auto-load portfolio data even without WebAssembly
            await fetchDowPortfolio();
            await fetchNikkeiPortfolio();
            await fetchUsdJpyPortfolio();
            await fetchPortfolio();
            return;
        }
        
        // Hide loading indicator
        document.getElementById('loading').style.display = 'none';
        
        // Setup event listeners
        setupEventListeners();
        setupAutoUpdateControls();
        
        // WebAssembly module loaded successfully
        console.log('WebAssembly portfolio calculation functions are ready.');
        
        // Auto-load portfolio data on startup
        await fetchDowPortfolio();
        await fetchNikkeiPortfolio();
        await fetchUsdJpyPortfolio();
        await fetchPortfolio();
        
    } catch (error) {
        console.error('Failed to initialize WebAssembly:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').classList.remove('hidden');
        
        // Fallback: create mock functions for demonstration
        console.log('Creating fallback demo functions...');
        setupFallbackDemo();
        
        // Still load portfolio data even if WebAssembly fails
        await fetchDowPortfolio();
        await fetchNikkeiPortfolio();
        await fetchUsdJpyPortfolio();
        await fetchPortfolio();
    }
}

// Setup event listeners for WebAssembly and portfolio features
function setupEventListeners() {
    // Event listeners for stock portfolio features are handled in setupAutoUpdateControls()
}

// Setup fallback demo functions when WASM is not available
function setupFallbackDemo() {
    // Create mock wasm object with fallback functions
    wasm = {
        // Portfolio calculation fallback functions
        calculate_portfolio_value: (shares, currentPrice) => shares * currentPrice,
        calculate_unrealized_gain: (marketValue, totalCost) => marketValue - totalCost,
        calculate_gain_percentage: (unrealizedGain, totalCost) => totalCost > 0 ? (unrealizedGain / totalCost) * 100 : 0,
        format_currency_jpy: (amount) => `¥${amount.toLocaleString()}`,
        parse_stock_price: (priceString) => parseFloat(priceString.replace(/[^\d.-]/g, '')) || 0,
        // Complete portfolio calculation functions
        calculate_complete_portfolio: (shares, purchasePrice, currentPriceStr) => {
            const currentPrice = parseFloat(currentPriceStr.replace(/[^\d.-]/g, '')) || 0;
            const marketValue = shares * currentPrice;
            const totalCost = shares * purchasePrice;
            const unrealizedGain = marketValue - totalCost;
            const gainPercentage = totalCost > 0 ? (unrealizedGain / totalCost) * 100 : 0;
            return {
                shares,
                purchase_price: purchasePrice,
                current_price: currentPrice,
                market_value: marketValue,
                total_cost: totalCost,
                unrealized_gain: unrealizedGain,
                gain_percentage: gainPercentage
            };
        },
        // Rust-style stock fetching functions
        fetch_sony_stock_wasm: async () => {
            console.log('Fetching Sony stock data from JavaScript fallback...');
            const response = await fetch('/api/finance/sony');
            const data = await response.json();
            console.log('Sony stock data fetched successfully from fallback');
            return data;
        },
        fetch_rakuten_stock_wasm: async () => {
            console.log('Fetching Rakuten stock data from JavaScript fallback...');
            const response = await fetch('/api/finance/rakuten');
            const data = await response.json();
            console.log('Rakuten stock data fetched successfully from fallback');
            return data;
        },
        fetch_imurayama_stock_wasm: async () => {
            console.log('Fetching JX Metals stock data from JavaScript fallback...');
            const response = await fetch('/api/finance/imurayama');
            const data = await response.json();
            console.log('JX Metals stock data fetched successfully from fallback');
            return data;
        }
    };
    
    // Hide loading indicator
    document.getElementById('loading').style.display = 'none';
    
    // Hide error message
    document.getElementById('error').classList.add('hidden');
    
    setupEventListeners();
    setupAutoUpdateControls();
    displayMessage('Running in fallback mode - WASM module not available', 'hello-output', 'warning');
}

// Utility function to display messages
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

// Auto-update state
let autoUpdateInterval = null;
let countdownInterval = null;
let remainingTime = 0;

// Function to update the last update time
function updateLastUpdateTime() {
    const lastUpdateElement = document.getElementById('last-update-time');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = `最終更新: ${new Date().toLocaleString('ja-JP')}`;
    }
}

function setupAutoUpdateControls() {
    const toggleAutoUpdateBtn = document.getElementById('toggle-auto-update-btn');
    const updateIntervalSelect = document.getElementById('update-interval');
    const countdownDisplay = document.getElementById('countdown-display');
    
    // Auto-update toggle button
    if (toggleAutoUpdateBtn) {
        toggleAutoUpdateBtn.addEventListener('click', () => {
            if (autoUpdateInterval) {
                stopAutoUpdate();
            } else {
                startAutoUpdate();
            }
        });
    }
    
    // Interval change handler
    if (updateIntervalSelect) {
        updateIntervalSelect.addEventListener('change', () => {
            if (autoUpdateInterval) {
                stopAutoUpdate();
                startAutoUpdate();
            }
        });
    }
    
    // Set compact display on startup
    updateDisplaySize('compact');
}

function updateDisplaySize(size) {
    const stockContainers = document.querySelectorAll('.stock-container');
    
    stockContainers.forEach(container => {
        // Remove existing size classes
        container.classList.remove('compact', 'normal', 'large');
        
        // Add new size class
        if (size !== 'normal') {
            container.classList.add(size);
        }
    });
}

async function fetchSonyStock() {
    const loadSonyStockBtn = document.getElementById('load-sony-stock-btn');
    const sonyStockOutput = document.getElementById('sony-stock-output');
    const sonyStockContent = document.getElementById('sony-stock-content');
    
    try {
        if (loadSonyStockBtn) {
            loadSonyStockBtn.disabled = true;
            loadSonyStockBtn.textContent = 'Loading...';
        }
        
        sonyStockOutput.innerHTML = '<p class="loading">Fetching Sony stock price...</p>';
        
        // Use Rust WebAssembly function for complete stock processing
        const result = (wasm && wasm.fetch_sony_stock_wasm) ? await wasm.fetch_sony_stock_wasm() : await fetch('/api/finance/sony').then(r => r.json());
        
        if (result.success && result.data) {
            const stockData = result.data;
            
            // Format price display based on currency
            const priceDisplay = stockData.currency === 'JPY' 
                ? stockData.current_price 
                : `$${stockData.current_price}`;
            
            // Calculate portfolio values for Sony using Rust WebAssembly
            const shares = 1000;
            const purchasePrice = 333;
            const currentPrice = (wasm && wasm.parse_stock_price) ? wasm.parse_stock_price(stockData.current_price) : parseFloat(stockData.current_price.replace(/[^\d.-]/g, '')) || 0;
            const marketValue = (wasm && wasm.calculate_portfolio_value) ? wasm.calculate_portfolio_value(shares, currentPrice) : shares * currentPrice;
            const totalCost = shares * purchasePrice;
            const unrealizedGain = (wasm && wasm.calculate_unrealized_gain) ? wasm.calculate_unrealized_gain(marketValue, totalCost) : marketValue - totalCost;
            const gainPercent = (wasm && wasm.calculate_gain_percentage) ? wasm.calculate_gain_percentage(unrealizedGain, totalCost) : (totalCost > 0 ? ((unrealizedGain / totalCost) * 100) : 0);

            // Display stock information using DOW portfolio style with portfolio details
            const gainLossClass = unrealizedGain >= 0 ? 'positive' : 'negative';
            const stockInfo = `
                <div class="portfolio-overview">
                    <div class="portfolio-stock">
                        <div><strong>Code:</strong> ${stockData.symbol}</div>
                        <div><strong>Name:</strong> ${stockData.company_name}</div>
                        <div><strong>Price:</strong> ${priceDisplay || 'N/A'}</div>
                        <div><strong>Shares:</strong> ${shares.toLocaleString()}株</div>
                        <div><strong>Purchase Price:</strong> ¥${purchasePrice.toLocaleString()}</div>
                        <div><strong>評価損益:</strong> <span class="${gainLossClass}">¥${unrealizedGain.toLocaleString()} (${gainPercent.toFixed(2)}%)</span></div>
                        <div><strong>Ratio:</strong> ${stockData.change || 'N/A'}</div>
                        <div><strong>Percent:</strong> ${stockData.change_percent || 'N/A'}</div>
                    </div>
                </div>
            `;
            
            sonyStockContent.innerHTML = stockInfo;
            
            // Update the last update time immediately after content is set
            setTimeout(() => {
                const timestampElement = document.getElementById('last-update-time');
                if (timestampElement) {
                    timestampElement.textContent = `最終更新: ${new Date().toLocaleString('ja-JP')}`;
                }
            }, 50);
            
            sonyStockOutput.innerHTML = '<p class="success">株価データが正常に更新されました</p>';
            
        } else {
            throw new Error(result.error || 'Failed to fetch Sony stock data');
        }
        
    } catch (error) {
        console.error('Sony stock fetch error:', error);
        sonyStockOutput.innerHTML = `<p class="error">株価取得エラー: ${error.message}</p>`;
        sonyStockContent.innerHTML = '';
    } finally {
        if (loadSonyStockBtn) {
            loadSonyStockBtn.disabled = false;
            loadSonyStockBtn.textContent = 'Get Sony Stock Price';
        }
    }
}

async function fetchRakutenStock() {
    const loadRakutenStockBtn = document.getElementById('load-rakuten-stock-btn');
    const rakutenStockOutput = document.getElementById('rakuten-stock-output');
    const rakutenStockContent = document.getElementById('rakuten-stock-content');
    
    try {
        if (loadRakutenStockBtn) {
            loadRakutenStockBtn.disabled = true;
            loadRakutenStockBtn.textContent = 'Loading...';
        }
        
        rakutenStockOutput.innerHTML = '<p class="loading">楽天グループ株価を取得中...</p>';
        
        // Use Rust WebAssembly function for complete stock processing
        const result = (wasm && wasm.fetch_rakuten_stock_wasm) ? await wasm.fetch_rakuten_stock_wasm() : await fetch('/api/finance/rakuten').then(r => r.json());
        
        if (result.success && result.data) {
            const stockData = result.data;
            
            // Format price display based on currency
            const priceDisplay = stockData.currency === 'JPY' 
                ? stockData.current_price 
                : `$${stockData.current_price}`;
            
            // Calculate portfolio values for Rakuten using Rust WebAssembly
            const shares = 100;
            const purchasePrice = 977;
            const currentPrice = (wasm && wasm.parse_stock_price) ? wasm.parse_stock_price(stockData.current_price) : parseFloat(stockData.current_price.replace(/[^\d.-]/g, '')) || 0;
            const marketValue = (wasm && wasm.calculate_portfolio_value) ? wasm.calculate_portfolio_value(shares, currentPrice) : shares * currentPrice;
            const totalCost = shares * purchasePrice;
            const unrealizedGain = (wasm && wasm.calculate_unrealized_gain) ? wasm.calculate_unrealized_gain(marketValue, totalCost) : marketValue - totalCost;
            const gainPercent = (wasm && wasm.calculate_gain_percentage) ? wasm.calculate_gain_percentage(unrealizedGain, totalCost) : (totalCost > 0 ? ((unrealizedGain / totalCost) * 100) : 0);

            // Display stock information using DOW portfolio style with portfolio details
            const gainLossClass = unrealizedGain >= 0 ? 'positive' : 'negative';
            const stockInfo = `
                <div class="portfolio-overview">
                    <div class="portfolio-stock">
                        <div><strong>Code:</strong> ${stockData.symbol}</div>
                        <div><strong>Name:</strong> ${stockData.company_name}</div>
                        <div><strong>Price:</strong> ${priceDisplay || 'N/A'}</div>
                        <div><strong>Shares:</strong> ${shares.toLocaleString()}株</div>
                        <div><strong>Purchase Price:</strong> ¥${purchasePrice.toLocaleString()}</div>
                        <div><strong>評価損益:</strong> <span class="${gainLossClass}">¥${unrealizedGain.toLocaleString()} (${gainPercent.toFixed(2)}%)</span></div>
                        <div><strong>Ratio:</strong> ${stockData.change || 'N/A'}</div>
                        <div><strong>Percent:</strong> ${stockData.change_percent || 'N/A'}</div>
                    </div>
                </div>
            `;
            
            rakutenStockContent.innerHTML = stockInfo;
            
            // Update the last update time immediately after content is set
            setTimeout(() => {
                const timestampElement = document.getElementById('rakuten-last-update-time');
                if (timestampElement) {
                    timestampElement.textContent = `最終更新: ${new Date().toLocaleString('ja-JP')}`;
                }
            }, 50);
            
            rakutenStockOutput.innerHTML = '<p class="success">楽天株価データが正常に更新されました</p>';
            
        } else {
            throw new Error(result.error || 'Failed to fetch Rakuten stock data');
        }
        
    } catch (error) {
        console.error('Rakuten stock fetch error:', error);
        rakutenStockOutput.innerHTML = `<p class="error">楽天株価取得エラー: ${error.message}</p>`;
        rakutenStockContent.innerHTML = '';
    } finally {
        if (loadRakutenStockBtn) {
            loadRakutenStockBtn.disabled = false;
            loadRakutenStockBtn.textContent = '楽天株価取得';
        }
    }
}

async function fetchPortfolio() {
    const portfolioSummary = document.getElementById('portfolio-summary');
    
    try {
        portfolioSummary.innerHTML = '<p class="loading">ポートフォリオを更新中...</p>';
        
        const response = await fetch('/api/finance/portfolio');
        const result = await response.json();
        
        if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
            let totalCost = 0;
            let totalMarketValue = 0;
            
            result.data.forEach(stock => {
                if (stock && stock.holdings) {
                    const shares = stock.holdings.shares || 0;
                    const purchasePrice = stock.holdings.purchase_price || 0;
                    const currentPriceStr = stock.current_price || '0';
                    const currentPrice = (wasm && wasm.parse_stock_price) ? wasm.parse_stock_price(currentPriceStr) : parseFloat(currentPriceStr.replace(/[^\d.-]/g, '')) || 0;
                    const cost = shares * purchasePrice;
                    const marketValue = (wasm && wasm.calculate_portfolio_value) ? wasm.calculate_portfolio_value(shares, currentPrice) : shares * currentPrice;
                    
                    totalCost += cost;
                    totalMarketValue += marketValue;
                }
            });
            
            const totalGain = (wasm && wasm.calculate_unrealized_gain) ? wasm.calculate_unrealized_gain(totalMarketValue, totalCost) : totalMarketValue - totalCost;
            const totalGainPercent = (wasm && wasm.calculate_gain_percentage) ? wasm.calculate_gain_percentage(totalGain, totalCost) : (totalCost > 0 ? ((totalGain / totalCost) * 100) : 0);
            
            const portfolioHtml = `
                <div class="portfolio-overview">
                    <div class="portfolio-total">
                        <p><strong>購入金額の合計:</strong> ¥${totalCost.toLocaleString()}</p>
                        <p><strong>時価総額:</strong> ¥${totalMarketValue.toLocaleString()}</p>
                        <p class="gain-loss ${totalGain >= 0 ? 'positive' : 'negative'}">
                            <strong>評価損益:</strong> ¥${totalGain.toLocaleString()} (${totalGainPercent.toFixed(2)}%)
                        </p>
                    </div>
                </div>
            `;
            
            portfolioSummary.innerHTML = portfolioHtml;
            
            // Update individual stocks
            await fetchSonyStock();
            await fetchRakutenStock();
            await fetchImurayamaStock();
            
        } else {
            throw new Error(result.error || 'No portfolio data available');
        }
        
    } catch (error) {
        console.error('Portfolio fetch error:', error);
        portfolioSummary.innerHTML = `<p class="error">ポートフォリオ取得エラー: ${error.message}</p>`;
    }
}

async function fetchImurayamaStock() {
    const loadImurayamaStockBtn = document.getElementById('load-imurayama-stock-btn');
    const imurayamaStockOutput = document.getElementById('imurayama-stock-output');
    const imurayamaStockContent = document.getElementById('imurayama-stock-content');
    
    try {
        if (loadImurayamaStockBtn) {
            loadImurayamaStockBtn.disabled = true;
            loadImurayamaStockBtn.textContent = 'Loading...';
        }
        
        imurayamaStockOutput.innerHTML = '<p class="loading">JX金属株価を取得中...</p>';
        
        // Use Rust WebAssembly function for complete stock processing
        const result = (wasm && wasm.fetch_imurayama_stock_wasm) ? await wasm.fetch_imurayama_stock_wasm() : await fetch('/api/finance/imurayama').then(r => r.json());
        
        if (result.success && result.data) {
            const stockData = result.data;
            
            // Format price display based on currency
            const priceDisplay = stockData.currency === 'JPY' 
                ? stockData.current_price 
                : `$${stockData.current_price}`;
            
            // Calculate portfolio values for JX Metals using Rust WebAssembly
            const shares = 300;
            const purchasePrice = 1801;
            const currentPrice = (wasm && wasm.parse_stock_price) ? wasm.parse_stock_price(stockData.current_price) : parseFloat(stockData.current_price.replace(/[^\d.-]/g, '')) || 0;
            const marketValue = (wasm && wasm.calculate_portfolio_value) ? wasm.calculate_portfolio_value(shares, currentPrice) : shares * currentPrice;
            const totalCost = shares * purchasePrice;
            const unrealizedGain = (wasm && wasm.calculate_unrealized_gain) ? wasm.calculate_unrealized_gain(marketValue, totalCost) : marketValue - totalCost;
            const gainPercent = (wasm && wasm.calculate_gain_percentage) ? wasm.calculate_gain_percentage(unrealizedGain, totalCost) : (totalCost > 0 ? ((unrealizedGain / totalCost) * 100) : 0);

            // Display stock information using DOW portfolio style with portfolio details
            const gainLossClass = unrealizedGain >= 0 ? 'positive' : 'negative';
            const stockInfo = `
                <div class="portfolio-overview">
                    <div class="portfolio-stock">
                        <div><strong>Code:</strong> ${stockData.symbol}</div>
                        <div><strong>Name:</strong> ${stockData.company_name}</div>
                        <div><strong>Price:</strong> ${priceDisplay || 'N/A'}</div>
                        <div><strong>Shares:</strong> ${shares.toLocaleString()}株</div>
                        <div><strong>Purchase Price:</strong> ¥${purchasePrice.toLocaleString()}</div>
                        <div><strong>評価損益:</strong> <span class="${gainLossClass}">¥${unrealizedGain.toLocaleString()} (${gainPercent.toFixed(2)}%)</span></div>
                        <div><strong>Ratio:</strong> ${stockData.change || 'N/A'}</div>
                        <div><strong>Percent:</strong> ${stockData.change_percent || 'N/A'}</div>
                    </div>
                </div>
            `;
            
            imurayamaStockContent.innerHTML = stockInfo;
            
            // Update the last update time immediately after content is set
            setTimeout(() => {
                const timestampElement = document.getElementById('imurayama-last-update-time');
                if (timestampElement) {
                    timestampElement.textContent = `最終更新: ${new Date().toLocaleString('ja-JP')}`;
                }
            }, 50);
            
            imurayamaStockOutput.innerHTML = '<p class="success">JX金属株価データが正常に更新されました</p>';
            
        } else {
            throw new Error(result.error || 'Failed to fetch Imurayama stock data');
        }
        
    } catch (error) {
        console.error('Imurayama stock fetch error:', error);
        imurayamaStockOutput.innerHTML = `<p class="error">JX金属株価取得エラー: ${error.message}</p>`;
        imurayamaStockContent.innerHTML = '';
    } finally {
        if (loadImurayamaStockBtn) {
            loadImurayamaStockBtn.disabled = false;
            loadImurayamaStockBtn.textContent = 'JX金属株価取得';
        }
    }
}

function startAutoUpdate() {
    const toggleAutoUpdateBtn = document.getElementById('toggle-auto-update-btn');
    const updateIntervalSelect = document.getElementById('update-interval');
    const countdownDisplay = document.getElementById('countdown-display');
    
    const intervalSeconds = parseInt(updateIntervalSelect.value);
    
    // Update button state
    toggleAutoUpdateBtn.textContent = 'Stop Auto Update';
    toggleAutoUpdateBtn.classList.add('auto-updating');
    
    // Initial fetch
    fetchSonyStock();
    
    // Set up auto-update interval
    autoUpdateInterval = setInterval(async () => {
        await fetchDowPortfolio();
        await fetchNikkeiPortfolio();
        await fetchUsdJpyPortfolio();
        await fetchPortfolio();
        resetCountdown(intervalSeconds);
    }, intervalSeconds * 1000);
    
    // Start countdown
    resetCountdown(intervalSeconds);
    
    displayMessage('自動更新が開始されました', 'sony-stock-output', 'success');
}

function stopAutoUpdate() {
    const toggleAutoUpdateBtn = document.getElementById('toggle-auto-update-btn');
    const countdownDisplay = document.getElementById('countdown-display');
    
    // Clear intervals
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
        autoUpdateInterval = null;
    }
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    // Update button state
    toggleAutoUpdateBtn.textContent = 'Start Auto Update';
    toggleAutoUpdateBtn.classList.remove('auto-updating');
    
    // Clear countdown display
    countdownDisplay.textContent = '';
    
    displayMessage('自動更新が停止されました', 'sony-stock-output', 'warning');
}

function resetCountdown(seconds) {
    const countdownDisplay = document.getElementById('countdown-display');
    
    remainingTime = seconds;
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    countdownInterval = setInterval(() => {
        remainingTime--;
        
        if (remainingTime <= 0) {
            countdownDisplay.textContent = '更新中...';
            clearInterval(countdownInterval);
        } else {
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            const timeString = minutes > 0 
                ? `${minutes}:${seconds.toString().padStart(2, '0')}`
                : `${seconds}秒`;
            countdownDisplay.textContent = `次回更新: ${timeString}`;
        }
    }, 1000);
    
    // Initial display
    const minutes = Math.floor(remainingTime / 60);
    const secs = remainingTime % 60;
    const timeString = minutes > 0 
        ? `${minutes}:${secs.toString().padStart(2, '0')}`
        : `${secs}秒`;
    countdownDisplay.textContent = `次回更新: ${timeString}`;
}

async function fetchDowPortfolio() {
    const dowPortfolioDiv = document.getElementById('dow-portfolio');
    
    try {
        const response = await fetch('/api/finance/dow');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseText = await response.text();
        
        if (!responseText || responseText.startsWith('<')) {
            throw new Error('Received HTML instead of JSON data');
        }
        
        const result = JSON.parse(responseText);
        
        if (result.success && result.data) {
            const stockData = result.data;
            
            // Portfolio configuration for Dow
            
            const portfolioHtml = `
                <div class="portfolio-overview">
                    <div class="portfolio-stock">
                        <div><strong>Code:</strong> ${stockData.symbol}</div>
                        <div><strong>Name:</strong> ${stockData.company_name}</div>
                        <div><strong>Price:</strong> $${stockData.current_price}</div>
                        <div><strong>Ratio:</strong> ${stockData.change || 'N/A'}</div>
                        <div><strong>Percent:</strong> ${stockData.change_percent || 'N/A'}</div>
                    </div>

                </div>
            `;
            
            dowPortfolioDiv.innerHTML = portfolioHtml;
            
        } else {
            throw new Error(result.error || 'Failed to fetch Dow portfolio data');
        }
        
    } catch (error) {
        console.error('Dow portfolio fetch error:', error);
        dowPortfolioDiv.innerHTML = `<p class="error">ダウポートフォリオ取得エラー: ${error.message}</p>`;
    }
}

async function fetchNikkeiPortfolio() {
    const nikkeiPortfolioDiv = document.getElementById('nikkei-portfolio');
    
    try {
        const response = await fetch('/api/finance/nikkei');
        const result = await response.json();
        
        if (result.success && result.data) {
            const stockData = result.data;
            
            // Portfolio configuration for Nikkei
            
            const portfolioHtml = `
                <div class="portfolio-overview">
                    <div class="portfolio-stock">
                        <div><strong>Code:</strong> ${stockData.symbol}</div>
                        <div><strong>Name:</strong> ${stockData.company_name}</div>
                        <div><strong>Price:</strong> ¥${stockData.current_price}</div>
                        <div><strong>Ratio:</strong> ${stockData.change || 'N/A'}</div>
                        <div><strong>Percent:</strong> ${stockData.change_percent || 'N/A'}</div>
                    </div>

                </div>
            `;
            
            nikkeiPortfolioDiv.innerHTML = portfolioHtml;
            
        } else {
            throw new Error(result.error || 'Failed to fetch Nikkei portfolio data');
        }
        
    } catch (error) {
        console.error('Nikkei portfolio fetch error:', error);
        nikkeiPortfolioDiv.innerHTML = `<p class="error">日経平均ポートフォリオ取得エラー: ${error.message}</p>`;
    }
}

async function fetchUsdJpyPortfolio() {
    const usdJpyPortfolioDiv = document.getElementById('usdjpy-portfolio');
    
    try {
        const response = await fetch('/api/finance/usdjpy');
        const result = await response.json();
        
        if (result.success && result.data) {
            const rateData = result.data;
            
            // Portfolio configuration for USD/JPY
            const usdAmount = 1000; // USD amount
            const currentRate = parseFloat(rateData.current_price) || 0;
            const currentValue = usdAmount * currentRate;
            
            const portfolioHtml = `
                <div class="portfolio-overview">
                    <div class="portfolio-stock">
                        <div><strong>Code:</strong> ${rateData.symbol}</div>
                        <div><strong>Name:</strong> ${rateData.company_name}</div>
                        <div><strong>Price:</strong> ¥${rateData.current_price}</div>
                        <div><strong>Ratio:</strong> ${rateData.change || 'N/A'}</div>
                        <div><strong>Percent:</strong> ${rateData.change_percent || 'N/A'}</div>
                    </div>

                </div>
            `;
            
            usdJpyPortfolioDiv.innerHTML = portfolioHtml;
            
        } else {
            throw new Error(result.error || 'Failed to fetch USD/JPY rate data');
        }
        
    } catch (error) {
        console.error('USD/JPY portfolio fetch error:', error);
        usdJpyPortfolioDiv.innerHTML = `<p class="error">USD/JPY為替ポートフォリオ取得エラー: ${error.message}</p>`;
    }
}

// Handle errors globally
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Initialize the application
init();
