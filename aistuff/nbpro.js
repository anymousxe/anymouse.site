import { connect } from "puppeteer-real-browser";
import axios from "axios";

// THIS IS THE SECRET SAUCE FOR VERCEL
export const config = { maxDuration: 60 };

const SITE_URL = "https://fluxproweb.com/model/nano-banana-ai/";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Use POST');
    
    const { prompt } = req.body;
    let browser, page;

    try {
        // Connect to virtual browser
        const data = await connect({
            headless: "new",
            turnstile: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        browser = data.browser;
        page = data.page;

        await page.goto(SITE_URL, { waitUntil: 'networkidle2' });
        
        // LOGIN LOGIC (Simplified from your provided script)
        // Note: You must include the MailTm and extraction logic here
        // once you have the token, we hit the API:

        const token = "STOLEN_TOKEN_HERE"; // Logic to extract from your script

        const genRes = await fetch("https://api2.tap4.ai/image/generator4login/async", {
            method: "POST",
            headers: { "authorization": "Bearer " + token, "content-type": "application/json" },
            body: JSON.stringify({
                "site": "fluxproweb.com",
                "modelName": "gemini-3-pro-image-preview",
                "prompt": prompt,
                "resolution": "2k"
            })
        });

        const result = await genRes.json();
        // Since no Firebase storage, we would fetch the image and send back as Base64
        const imageResponse = await axios.get(result.data.url, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(imageResponse.data, 'binary').toString('base64');
        
        res.status(200).json({ success: true, mediaData: `data:image/png;base64,${base64}` });

    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    } finally {
        if (browser) await browser.close();
    }
}
