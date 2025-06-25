// src/lib.rs

use worker::{event, console_log, Env, Request, Response, Result, Method, Context};
use scraper::{Html, Selector};
use serde_json::json;
//use worker::wasm_bindgen::JsValue;

// HTMLから個別株価データを抽出する関数 (変更なし)
// Yahoo!ファイナンス日本版のHTML構造に依存します。
// セレクタはウェブサイトの変更により機能しなくなる可能性があります。
fn extract_stock_data(html_body: &str, code: &str) -> serde_json::Value {
    let document = Html::parse_document(html_body);

    let mut company_code = code.to_string();
    let mut company_name = "N/A".to_string();
    let mut current_price = "N/A".to_string();
    let mut change_amount = "N/A".to_string();
    let mut change_percentage = "N/A".to_string();
    let mut update_time = "N/A".to_string();

    // 企業名
    let name_selector = Selector::parse("h2.PriceBoardMain__name__6uDh").unwrap();
    if let Some(element) = document.select(&name_selector).next() {
        company_name = element.text().collect::<Vec<_>>().join("").trim().to_string();
    }

    // 企業コード (既に引数で受け取っているが、Yahooから取得できるなら更新)
    let code_selector = Selector::parse("span.PriceBoardMain__code__2wso").unwrap();
    if let Some(element) = document.select(&code_selector).next() {
        let extracted_code = element.text().collect::<Vec<_>>().join("").trim().to_string();
        if !extracted_code.is_empty() {
             company_code = extracted_code.trim_matches('(').trim_matches(')').replace(".T", "").to_string();
        }
    }

    // 現在の株価
    let current_price_selector = Selector::parse("span.StyledNumber__value__3rXW").unwrap();
    if let Some(element) = document.select(&current_price_selector).next() {
        current_price = element.text().collect::<Vec<_>>().join("").trim().to_string();
    }

    // 前日比 (金額とパーセント)
    let price_change_dd_selector = Selector::parse("dd.PriceChangeLabel__description__a5Lp").unwrap();
    if let Some(dd_element) = document.select(&price_change_dd_selector).next() {
        let value_spans_selector = Selector::parse("span.StyledNumber__value__3rXW").unwrap();
        let values: Vec<String> = dd_element
            .select(&value_spans_selector)
            .map(|el| el.text().collect::<Vec<_>>().join("").trim().to_string())
            .collect();

        if values.len() >= 2 {
            change_amount = values[0].clone();
            change_percentage = values[1].clone();
        }
    }

    // 更新日時
    let time_selector = Selector::parse("#root > main > div > section > div.PriceBoardMain__1nb3 > div.PriceBoardMain__priceInformation__3YfB > div.PriceBoardMain__supplementBottom__380e > ul > li:nth-child(2)").unwrap();
    if let Some(element) = document.select(&time_selector).next() {
        update_time = element.text().collect::<Vec<_>>().join("").trim().to_string();
    }

    json!({
        "type": "stock",
        "company_code": company_code,
        "company_name": company_name,
        "current_price": current_price,
        "change_amount": change_amount,
        "change_percentage": change_percentage,
        "update_time": update_time,
        "source": "Yahoo! Finance Japan"
    })
}

// ダウ平均株価をスクレイピングする関数 (変更なし)
// Yahoo! Finance (US) のHTML構造に依存します。
// セレクタはウェブサイトの変更により機能しなくなる可能性があります。
async fn scrape_dow_average() -> Result<serde_json::Value> {
    let target_url = "https://finance.yahoo.co.jp/quote/%5EDJI"; // ダウ平均のYahoo Finance (US) URL
    console_log!("Scraping Dow Average from: {}", target_url);

    let fetch_result = worker::Fetch::Url(target_url.parse().unwrap())
        .send()
        .await?
        .text()
        .await;

    match fetch_result {
        Ok(html_body) => {
            let document = Html::parse_document(&html_body);
            
            // Yahoo Finance (US) のセレクタは特に変動が激しいため、要確認です。
            // 以下のセレクタはあくまで例であり、動かない可能性が高いです。
            // 実際のサイトのHTMLを確認し、正確なセレクタを見つけてください。
            
            let mut current_price = "N/A".to_string();
            let mut change_info = "N/A".to_string(); 
            let mut update_time = "N/A".to_string();

            // 現在価格
            //<span class="_StyledNumber__value_x0ii7_10">42,206.82</span>
            //#mainIndexPriceBoard > section > div._PriceBoardMain_feslz_1 > div._PriceBoardMain__priceInformation_feslz_66 > div._PriceBoardMain__headerPrice_feslz_73 > span > span > span
            let price_selector = Selector::parse("span._StyledNumber__value_x0ii7_10").unwrap();
            if let Some(element) = document.select(&price_selector).next() {
                current_price = element.text().collect::<Vec<_>>().join("").trim().to_string();
            }

            // 変化量と変化率
            let change_amount_selector = Selector::parse("div._PriceBoardMain_feslz_1 > div._PriceBoardMain__priceInformation_feslz_66 > div._PriceBoardMain__headerPrice_feslz_73 > div > div > dl > dd > span > span._StyledNumber__item_x0ii7_7._PriceChangeLabel__primary_l4zfe_55 > span").unwrap();
            let change_percent_selector = Selector::parse("div._PriceBoardMain_feslz_1 > div._PriceBoardMain__priceInformation_feslz_66 > div._PriceBoardMain__headerPrice_feslz_73 > div > div > dl > dd > span > span._StyledNumber__item_x0ii7_7._StyledNumber__item--secondary_x0ii7_27._PriceChangeLabel__secondary_l4zfe_61 > span._StyledNumber__value_x0ii7_10").unwrap();

            let mut amount_text = String::new();
            if let Some(element) = document.select(&change_amount_selector).next() {
                amount_text = element.text().collect::<Vec<_>>().join("").trim().to_string();
            }
            let mut percent_text = String::new();
            if let Some(element) = document.select(&change_percent_selector).next() {
                percent_text = element.text().collect::<Vec<_>>().join("").trim().to_string();
            }
            if !amount_text.is_empty() || !percent_text.is_empty() {
                change_info = format!("{} ({})", amount_text, percent_text);
            }
            
            // 更新時間 (要確認)
             let time_selector = Selector::parse("div._PriceBoardMain_feslz_1 > div._PriceBoardMain__priceInformation_feslz_66 > div._PriceBoardMain__supplementBottom_feslz_88 > ul > li:nth-child(2) > time").unwrap();
                if let Some(element) = document.select(&time_selector).next() {
                    update_time = element.text().collect::<Vec<_>>().join("").trim().to_string();
            }

            Ok(json!({
                "type": "index",
                "index_name": "Dow Jones Industrial Average",
                "symbol": "^DJI",
                "current_price": current_price,
                "change": change_info,
                "update_time": update_time,
                "source": "Yahoo! Finance (US)"
            }))
        },
        Err(e) => {
            console_log!("Failed to scrape Dow Average: {:?}", e);
            Ok(json!({
                "type": "index",
                "index_name": "Dow Jones Industrial Average",
                "symbol": "^DJI",
                "status": "error",
                "message": format!("Scraping error: {:?}", e)
            }))
        }
    }
}

// 日経平均株価をスクレイピングする関数 - 998407.O のページから取得
// Yahoo!ファイナンス日本版の998407.OページのHTML構造に依存します。
// セレクタはウェブサイトの変更により機能しなくなる可能性があります。
async fn scrape_nikkei_average() -> Result<serde_json::Value> {
    let target_url = "https://finance.yahoo.co.jp/quote/998407.O"; // 新しいターゲットURL
    console_log!("Scraping Nikkei Average from: {}", target_url);

    let fetch_result = worker::Fetch::Url(target_url.parse().unwrap())
        .send()
        .await?
        .text()
        .await;

    match fetch_result {
        Ok(html_body) => {
            let document = Html::parse_document(&html_body);
            
            // 以下は、998407.OページのHTML構造に基づいたセレクタの例です。
            // 実際のウェブサイトを確認し、正確なセレクタに修正してください。
            
            let mut current_price = "N/A".to_string();
            let mut change_amount = "N/A".to_string();
            let mut change_percentage = "N/A".to_string();
            let mut update_time = "N/A".to_string();

            // 価格
            let price_selector = Selector::parse("div > div.board__30eL > div.contents__2Ods > div.values__1Grf > p.price__2oKW > span").unwrap();
            if let Some(element) = document.select(&price_selector).next() {
                current_price = element.text().collect::<Vec<_>>().join("").trim().to_string();
            }

            // 前日比 (金額とパーセント)<span class="StyledNumber__item__1-yu PriceChangeLabel__primary__Y_ut"><span class="StyledNumber__value__3rXW">-0.74</span></span>
            // let selector = Selector::parse("span.PriceChangeLabel__primary__Y_ut > span.StyledNumber__value__3rXW").map_err(|e| worker::Error::RustError(format!("Invalid selector: {}", e)))?;

            let price_change_dd_selector = Selector::parse("div > div.board__30eL > div.contents__2Ods > div.values__1Grf > p.changePriceLabel__2rHy.bgRed__3zWT > span.changePrice__3dJY > span > span.number__3wVT").unwrap();
            if let Some(dd_element) = document.select(&price_change_dd_selector).next() {
                let value_spans_selector = Selector::parse("div > div.board__30eL > div.contents__2Ods > div.values__1Grf > p.changePriceLabel__2rHy.bgRed__3zWT > span.changePriceRate__3pJv > span > span.number__3wVT").unwrap();
                let values: Vec<String> = dd_element
                    .select(&value_spans_selector)
                    .map(|el| el.text().collect::<Vec<_>>().join("").trim().to_string())
                    .collect();

                if values.len() >= 2 {
                    change_amount = values[0].clone();
                    change_percentage = values[1].clone();
                }
            }

            // 更新日時 (個別の株価ページと同じセレクタが機能する可能性が高い)
             let time_selector = Selector::parse("div > div.board__30eL > div.contents__2Ods > div.supplements__1ZLy > div.supplement__1hXE > ul > li:nth-child(2) > time").unwrap();
                if let Some(element) = document.select(&time_selector).next() {
                    update_time = element.text().collect::<Vec<_>>().join("").trim().to_string();
            }
            
            Ok(json!({
                "type": "index",
                "index_name": "Nikkei 225 Futures", // 指標名を変更
                "symbol": "998407.O", // シンボルを修正
                "current_price": current_price,
                "change_amount": change_amount,
                "change_percentage": change_percentage,
                "update_time": update_time,
                "source": "Yahoo! Finance Japan (Futures)" // ソースも変更
            }))
        },
        Err(e) => {
            console_log!("Failed to scrape Nikkei Average from 998407.O: {:?}", e);
            Ok(json!({
                "type": "index",
                "index_name": "Nikkei 225 Futures",
                "symbol": "998407.O",
                "status": "error",
                "message": format!("Scraping error: {:?}", e)
            }))
        }
    }
}


// fetch イベントハンドラ (変更なし)
#[event(fetch)]
async fn fetch(req: Request, _env: Env, _ctx: Context) -> Result<Response> {
    console_log!("Worker received request.");

    // OPTIONSリクエスト（CORSプリフライト）
    if req.method() == Method::Options {
        let mut response = Response::empty()?;
        response.headers_mut().set("Access-Control-Allow-Origin", "*")?;
        response.headers_mut().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")?;
        response.headers_mut().set("Access-Control-Allow-Headers", "Content-Type")?;
        console_log!("Handling OPTIONS request for CORS.");
        return Ok(response);
    }

    let url = req.url()?;
    let path = url.path();
    let query_params = url.query_pairs();

    if path == "/" || path == "/api/stocks" {
        let mut stock_codes: Vec<String> = Vec::new();

        // クエリパラメータからcodesを取得
        for (key, value) in query_params {
            if key == "codes" {
                stock_codes = value.split(',').map(|s| s.trim().to_string()).collect();
                break;
            }
        }

        // stock_codesが空の場合、デフォルトで6758.T, ^DJI, ^N225 を追加
        if stock_codes.is_empty() {
            stock_codes.push("6758.T".to_string());
            stock_codes.push("^DJI".to_string());
            stock_codes.push("^N225".to_string()); // ここで引き続き ^N225 を使う
            console_log!("No 'codes' query parameter provided. Using default: {:?}", stock_codes);
        } else {
            console_log!("Received codes: {:?}", stock_codes);
        }

        let mut results = Vec::new();

        for code in stock_codes {
            let processed_code = code.to_uppercase(); 

            let result_json = match processed_code.as_str() {
                "^DJI" => scrape_dow_average().await?,
                // ここで ^N225 が来たら、998407.Oをスクレイピングする関数を呼び出す
                // フロントエンドからは ^N225 で指定されることを想定
                "^N225" => scrape_nikkei_average().await?, 
                _ => {
                    // 通常の個別株
                    let yahoo_finance_url = format!("https://finance.yahoo.co.jp/quote/{}", code);
                    console_log!("Fetching data for: {}", code);
                    
                    let fetch_result = worker::Fetch::Url(yahoo_finance_url.parse().unwrap())
                        .send()
                        .await?
                        .text()
                        .await;

                    match fetch_result {
                        Ok(html_body) => {
                            console_log!("Fetched HTML for {}", code);
                            let stock_data = extract_stock_data(&html_body, &code);
                            stock_data
                        }
                        Err(e) => {
                            console_log!("Failed to fetch HTML for {}: {:?}", code, e);
                            json!({
                                "type": "stock",
                                "company_code": code,
                                "status": "error",
                                "message": format!("Fetch error: {:?}", e)
                            })
                        }
                    }
                }
            };
            results.push(result_json);
        }

        let response_data = json!({
            "status": "success",
            "data": results
        });

        console_log!("Response JSON: {}", response_data.to_string());

        let mut response = Response::ok(response_data.to_string())?;
        response.headers_mut().set("Content-Type", "application/json; charset=utf-8")?;
        response.headers_mut().set("Access-Control-Allow-Origin", "*")?;
        response.headers_mut().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")?;
        response.headers_mut().set("Access-Control-Allow-Headers", "Content-Type")?;

        Ok(response)
    } else {
        Response::error("Not Found", 404)
    }
}

#[event(start)]
fn start() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}