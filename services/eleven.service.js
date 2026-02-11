const { getCached, setCache } = require("./ttsCache");
const axios = require("axios");

async function textToSpeech(text) {
  const cached = getCached(text);
  if (cached) {
    console.log("⚡ TTS from cache");
    return cached;
  }

  const response = await axios({
    method: "POST",
    url: "https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
      "Content-Type": "application/json"
    },
    responseType: "arraybuffer",
    data: {
      text,
      model_id: "eleven_multilingual_v2"
    }
  });

  setCache(text, response.data);
  console.log("💰 TTS from ElevenLabs");

  return response.data;
}
