document.addEventListener('DOMContentLoaded', () => {
    const fetchDataButton = document.getElementById('fetch-data-button');
    const messageSpan = document.getElementById('message');
    const timestampSpan = document.getElementById('timestamp');
    const locationSpan = document.getElementById('location');
    const errorSpan = document.getElementById('error-message');

    // !!! IMPORTANT: ここにデプロイしたCloudflare WorkerのURLを正確に記述します !!!
    // 例: "https://your-worker-name.your-account.workers.dev/"
    // または、カスタムドメインを設定している場合はそのURL
    const WORKER_API_URL = "https://rustwasm-fullstack-app.sumitomo0210.workers.dev/"; // ★ここをあなたのWorkerのURLに置き換えてください★

    fetchDataButton.addEventListener('click', async () => {
        // エラーメッセージをクリア
        errorSpan.textContent = '';
        messageSpan.textContent = '取得中...';
        timestampSpan.textContent = '取得中...';
        locationSpan.textContent = '取得中...';
        codeSpan.textContent = '取得中...';

        try {
            // WorkerのAPIエンドポイントにフェッチリクエストを送信
            const response = await fetch(WORKER_API_URL);

            // HTTPステータスがOKでない場合（例: 404, 500など）
            if (!response.ok) {
                const errorText = await response.text(); // エラーレスポンスのボディを取得
                throw new Error(`APIからの応答エラー: ${response.status} ${response.statusText} - ${errorText}`);
            }

            // レスポンスボディをJSONとしてパース
            const data = await response.json();

            // 取得したデータをHTML要素に表示
            messageSpan.textContent = data.status || 'データなし';
            timestampSpan.textContent = data.update_time || 'データなし';
            locationSpan.textContent = data.location || 'データなし';
            codeSpan.textContent = data.status || 'データなし';
            nameSpan.textContent = data.update_time || 'データなし';
            priceSpan.textContent = data.location || 'データなし';

        } catch (error) {
            // エラーが発生した場合、コンソールと画面に表示
            console.error('データの取得中にエラーが発生しました:', error);
            errorSpan.textContent = `データの取得に失敗しました: ${error.message}`;
            messageSpan.textContent = '';
            timestampSpan.textContent = '';
            locationSpan.textContent = '';
        }
    });
});