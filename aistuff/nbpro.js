import { connect } from "puppeteer-real-browser";
import axios from "axios";

// Target for Gemini 3 Pro Images
const SITE_URL = "https://fluxproweb.com/model/nano-banana-ai/"; [cite: 2]
const ACTION_IDS = {
    REGISTER: "424401cbe4e8b1b79045e4ac3dcf3d788c2156dd", [cite: 3]
    VERIFY: "efbaa6169049c8cb5fd4fd1abe810d880738ab19", [cite: 3]
    LOGIN: "1c7778f900ce2db3f2c455a90e709ef29ae30db3" [cite: 3]
};

// ... (MailTm and extractToken logic from your original script goes here) ...

export default async function handler(req, res) {
    const { prompt } = req.body;
    
    // 1. Launch Browser
    const { browser, page } = await connect({ headless: true, turnstile: true }); [cite: 83]
    
    try {
        await page.goto(SITE_URL); [cite: 85]
        
        // 2. Automate Login (Reusable Logic)
        // [Add the REGISTER -> VERIFY -> LOGIN steps from your text file here]

        const token = await extractToken(page); [cite: 100]

        // 3. Request Image
        const payload = {
            "site": "fluxproweb.com",
            "imageType": "nano-banana-image", [cite: 49]
            "modelName": "gemini-3-pro-image-preview", [cite: 49]
            "prompt": prompt,
            "resolution": "2k" [cite: 51]
        };

        // Send to the generator API
        const genRes = await fetch("https://api2.tap4.ai/image/generator4login/async", { [cite: 53]
            method: "POST",
            headers: { "authorization": "Bearer " + token, "content-type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        const data = await genRes.json();
        res.status(200).json({ success: true, key: data.data.key }); [cite: 55]

    } catch (error) {
        res.status(500).json({ error: error.message }); [cite: 130]
    } finally {
        await browser.close(); [cite: 132]
    }
}
