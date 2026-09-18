async function test() {
  const targetUrl = 'https://lmsqa.opitech.com.co/lms/login';
  const res = await fetch(targetUrl);
  const html = await res.text();
  console.log('Contains __NEXT_DATA__:', html.includes('__NEXT_DATA__'));
  if (html.includes('__NEXT_DATA__')) {
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    if (match) {
      const data = JSON.parse(match[1]);
      console.log('assetPrefix:', data.assetPrefix);
      console.log('page:', data.page);
    }
  }
}
test().catch(console.error);
