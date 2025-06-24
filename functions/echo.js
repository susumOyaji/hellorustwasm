export const onRequestPost = async ({ request }) => {
  const data = await request.json(); // POSTされたJSONを取得
  const name = data.name || "匿名さん";

  return new Response(
    JSON.stringify({ success: true, message: `こんにちは、${name}！` }),
    { headers: { "Content-Type": "application/json" } }
  );
};