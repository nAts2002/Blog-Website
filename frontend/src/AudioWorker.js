import React, { useState } from "react";
import SoundOfText from "soundoftext-js";
import Select from "react-select";
import languages from "./languages.json"; // a list of supported languages

function AudioWorker({ insertTTSAudio }) {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Create a client object to call the soundoftext API
  const client = new SoundOfText({
    engine: "Google",
    apiRoot: "https://api.soundoftext.com",
  });

  // Get the sound URL from the API and call the insertTTSAudio function
  async function getSoundUrl() {
    setLoading(true);
    try {
      const data = await client.request({
        text: text,
        voice: language.value,
      });
      const soundUrl = await client.location(data.id);
      insertTTSAudio(soundUrl);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  return (
    <div className="AudioWorker">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to use TTS"
      />
      <Select
        value={language}
        onChange={setLanguage}
        options={languages}
        placeholder="Select language of your text"
      />
      <button onClick={getSoundUrl} disabled={!text || !language || loading}>
        {loading ? "Loading..." : "Add TTS sound"}
      </button>
    </div>
  );
}

export default AudioWorker;
