// functions/_middleware.js または functions/_worker.js
//Cloudflare Pages Functionsは、プロジェクト直下の「functions」ディレクトリ内のスクリプトを自動でWorkerとして認識して待機してくれるので、ファイルを用意します。

// wasm-pack でビルドされた hellorustwasm.js をインポート
// パスはあなたのプロジェクトのpkgディレクトリに合わせて調整してください
import init, { greet, parse_stock_price } from './api/pkg/hellorustwasm.js'; 

// Wasmモジュールが一度だけ初期化されるようにするためのフラグ
let wasmInitialized = false;






// Pages Functions のエントリポイント (onRequest フック)
export async function onRequest(context) {
    // Wasmモジュールがまだ初期化されていなければ初期化する
    // context.env.ASSETS.fetch は、Pages Functions の場合は静的アセットのフェッチ機能を提供します
    // init() には何を渡すべきかは、wasm-bindgenとworkerクレートのバージョンによって異なります。
    // 通常は init() だけで良いか、または context.env.ASSETS.fetch を渡します。
    if (!wasmInitialized) {
        // init() は Promise を返すので await が必要
        await init(context.env.ASSETS.fetch); 
        wasmInitialized = true;
        console.info("✅ WASM initialized (hellorustwasm)");
    }

    // ここでRust Wasmからエクスポートされた関数を呼び出す
    // 例:
    // const greeting = greet("Rust from Pages Functions");
    // console.log(greeting);

    // URLからクエリパラメータを取得し、Rust関数に渡す例
    const url = new URL(context.request.url);
    const amountStr = url.searchParams.get('amount'); // 例: ?amount=123,456.78

    if (amountStr) {
        // Rust Wasmの関数を呼び出す
        const parsedAmount = parse_stock_price(amountStr);
        console.log(`Parsed amount from Rust: ${parsedAmount}`);

        // レスポンスを生成して返す
        return new Response(`Parsed amount: ${parsedAmount}`);
    }

    // 何もしなければ、次のミドルウェアまたはルートハンドラに処理を渡す
    return context.next();
}