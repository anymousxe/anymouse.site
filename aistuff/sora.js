// Target for Sora 2 Videos
const SITE_URL = "https://fluxproweb.com/model/sora2-ai/";

// ... (Mail and Login logic stays exactly the same) ...

// Updated Generation Logic for Video
async function generateVideo(page, token, prompt) {
    return await page.evaluate(async (token, prompt) => {
        const payload = {
            "site": "fluxproweb.com",
            "imageType": "sora2-video", // Sora specific
            "modelName": "sora-2",      // Target model
            "prompt": prompt,
            "resolution": "1080p",      // Video resolution
            "ratio": "16:9" 
        };

        const res = await fetch("https://api2.tap4.ai/video/generator4login/async", {
            method: "POST",
            headers: { "authorization": "Bearer " + token, "content-type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        return json.data?.key; 
    }, token, prompt);
}
