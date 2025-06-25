use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Request, RequestInit, RequestMode, Response};
use serde::{Deserialize, Serialize};

// Import the `console.log` function from the browser
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Define a macro to make console.log! available
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

// Export a `greet` function from Rust to JavaScript
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    let greeting = format!("Hello, {}! This message is from Rust and WebAssembly.", name);
    console_log!("Greeting generated: {}", greeting);
    greeting
}

// Export a simple hello world function
#[wasm_bindgen]
pub fn hello_world() -> String {
    let message = "Hello, World from Rust and WebAssembly!";
    console_log!("Hello world function called");
    message.to_string()
}

// Export a function that performs a simple calculation
#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    let result = a + b;
    console_log!("Adding {} + {} = {}", a, b, result);
    result
}

// Export a function that returns current timestamp
#[wasm_bindgen]
pub fn get_timestamp() -> f64 {
    // Use a simple implementation without js_sys dependency
    1000.0 * 1000.0 * 1000.0 // placeholder timestamp
}

// Portfolio calculation functions for stock analysis
#[wasm_bindgen]
pub fn calculate_portfolio_value(shares: i32, current_price: f64) -> f64 {
    let market_value = shares as f64 * current_price;
    console_log!("Calculating portfolio value: {} shares × ¥{} = ¥{}", shares, current_price, market_value);
    market_value
}

#[wasm_bindgen]
pub fn calculate_unrealized_gain(market_value: f64, total_cost: f64) -> f64 {
    let gain = market_value - total_cost;
    console_log!("Calculating unrealized gain: ¥{} - ¥{} = ¥{}", market_value, total_cost, gain);
    gain
}

#[wasm_bindgen]
pub fn calculate_gain_percentage(unrealized_gain: f64, total_cost: f64) -> f64 {
    if total_cost == 0.0 {
        return 0.0;
    }
    let percentage = (unrealized_gain / total_cost) * 100.0;
    console_log!("Calculating gain percentage: (¥{} / ¥{}) × 100 = {}%", unrealized_gain, total_cost, percentage);
    percentage
}

#[wasm_bindgen]
pub fn format_currency_jpy(amount: f64) -> String {
    let formatted = format!("¥{:,.0}", amount);
    console_log!("Formatting JPY currency: {} → {}", amount, formatted);
    formatted
}

#[wasm_bindgen]
pub fn parse_stock_price(price_string: &str) -> f64 {
    // Remove non-numeric characters except decimal point and minus sign
    let cleaned: String = price_string.chars()
        .filter(|c| c.is_numeric() || *c == '.' || *c == '-')
        .collect();
    
    let parsed_price = cleaned.parse::<f64>().unwrap_or(0.0);
    console_log!("Parsing stock price: '{}' → '{}' → {}", price_string, cleaned, parsed_price);
    parsed_price
}

#[derive(Serialize, Deserialize)]
pub struct StockData {
    pub symbol: String,
    pub current_price: String,
    pub change: String,
    pub change_percent: String,
    pub currency: String,
}

#[derive(Serialize, Deserialize)]
pub struct ApiResponse {
    pub success: bool,
    pub data: StockData,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct PortfolioCalculation {
    pub shares: i32,
    pub purchase_price: f64,
    pub current_price: f64,
    pub market_value: f64,
    pub total_cost: f64,
    pub unrealized_gain: f64,
    pub gain_percentage: f64,
}

// Fetch stock data directly from Rust WebAssembly
#[wasm_bindgen]
pub async fn fetch_sony_stock_wasm() -> Result<JsValue, JsValue> {
    console_log!("Fetching Sony stock data from Rust WebAssembly...");
    
    let mut opts = RequestInit::new();
    opts.method("GET");
    opts.mode(RequestMode::Cors);
    
    let url = "/api/finance/sony";
    let request = Request::new_with_str_and_init(url, &opts)?;
    
    let window = web_sys::window().unwrap();
    let resp_value = JsFuture::from(window.fetch_with_request(&request)).await?;
    let resp: Response = resp_value.dyn_into().unwrap();
    
    let json = JsFuture::from(resp.json()?).await?;
    
    console_log!("Sony stock data fetched successfully from Rust");
    Ok(json)
}

#[wasm_bindgen]
pub async fn fetch_rakuten_stock_wasm() -> Result<JsValue, JsValue> {
    console_log!("Fetching Rakuten stock data from Rust WebAssembly...");
    
    let mut opts = RequestInit::new();
    opts.method("GET");
    opts.mode(RequestMode::Cors);
    
    let url = "/api/finance/rakuten";
    let request = Request::new_with_str_and_init(url, &opts)?;
    
    let window = web_sys::window().unwrap();
    let resp_value = JsFuture::from(window.fetch_with_request(&request)).await?;
    let resp: Response = resp_value.dyn_into().unwrap();
    
    let json = JsFuture::from(resp.json()?).await?;
    
    console_log!("Rakuten stock data fetched successfully from Rust");
    Ok(json)
}

#[wasm_bindgen]
pub async fn fetch_imurayama_stock_wasm() -> Result<JsValue, JsValue> {
    console_log!("Fetching JX Metals stock data from Rust WebAssembly...");
    
    let mut opts = RequestInit::new();
    opts.method("GET");
    opts.mode(RequestMode::Cors);
    
    let url = "/api/finance/imurayama";
    let request = Request::new_with_str_and_init(url, &opts)?;
    
    let window = web_sys::window().unwrap();
    let resp_value = JsFuture::from(window.fetch_with_request(&request)).await?;
    let resp: Response = resp_value.dyn_into().unwrap();
    
    let json = JsFuture::from(resp.json()?).await?;
    
    console_log!("JX Metals stock data fetched successfully from Rust");
    Ok(json)
}

// Complete portfolio calculation in Rust
#[wasm_bindgen]
pub fn calculate_complete_portfolio(
    shares: i32,
    purchase_price: f64,
    current_price_str: &str
) -> JsValue {
    let current_price = parse_stock_price(current_price_str);
    let market_value = calculate_portfolio_value(shares, current_price);
    let total_cost = shares as f64 * purchase_price;
    let unrealized_gain = calculate_unrealized_gain(market_value, total_cost);
    let gain_percentage = calculate_gain_percentage(unrealized_gain, total_cost);
    
    let portfolio = PortfolioCalculation {
        shares,
        purchase_price,
        current_price,
        market_value,
        total_cost,
        unrealized_gain,
        gain_percentage,
    };
    
    console_log!("Complete portfolio calculation: {:?}", serde_wasm_bindgen::to_value(&portfolio).unwrap());
    serde_wasm_bindgen::to_value(&portfolio).unwrap()
}

// Called when the WASM module is instantiated
#[wasm_bindgen(start)]
pub fn main() {
    console_log!("Hello from Rust and WebAssembly!");
}
