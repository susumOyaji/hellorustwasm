use worker::*;
use reqwest;
use scraper::{Html, Selector};

#[event(fetch)]
async fn fetch(
    _req: Request,
    _env: Env,
    _ctx: Context,
) -> Result<Response> {
    console_error_panic_hook::set_once();

    // Yahooのページを取得
    let res = reqwest::get("https://www.yahoo.co.jp").await?;
    let html = res.text().await?;

    // HTMLを解析
    let document = Html::parse_document(&html);
    let selector = Selector::parse("title").unwrap();
    let title = document.select(&selector)
        .next()
        .map(|element| element.inner_html())
        .unwrap_or_else(|| "Title not found".to_string());

    // JSONレスポンスを返す
    let json_response = format!(r#"{{"title": "{}"}}"#, title);
    Ok(Response::ok(json_response))
}