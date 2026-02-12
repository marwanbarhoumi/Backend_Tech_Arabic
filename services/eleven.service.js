const axios = require("axios");
const FormData = require("form-data");

const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.VOICE_ID;

// 🔊 TEXT TO SPEECH
exports.textToSpeech = async (text) => {
  const response = await axios({
    method: "POST",
    url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    headers: {
      "xi-api-key": ELEVEN_API_KEY,
      "Content-Type": "application/json"
    },
    responseType: "arraybuffer",
    data: {
      text,
      model_id: "eleven_multilingual_v2"
    }
  });

  return Buffer.from(response.data);
};

// 🎤 SPEECH TO TEXT
exports.speechToText = async (audioBuffer) => {
  const formData = new FormData();
  formData.append("file", audioBuffer, {
    filename: "audio.webm",
  });
  formData.append("model_id", "scribe_v1");

  const response = await axios.post(
    "https://api.elevenlabs.io/v1/speech-to-text",
    formData,
    {
      headers: {
        "xi-api-key": ELEVEN_API_KEY,
        ...formData.getHeaders()
      }
    }
  );

  return response.data.text;
};
