# SwasthyaMitra Backend Server

This Node.js + Express backend handles the core voice inputs for the SwasthyaMitra application. It features Gemini 1.5 Flash for Speech-to-Text and Google TTS for Text-to-Speech to support regional Indian languages in an accessible, voice-first manner.

## Setup

1. Make sure you are in the `swasthyamitra-backend` folder.
2. Install dependencies (already completed):
   ```bash
   npm install
   ```
3. Open the `.env` file and verify your `GEMINI_API_KEY`.
4. Start the server:
   ```bash
   node server.js
   ```
   *The server should run on `http://localhost:5000`.*

## Testing with Postman
Send a `POST` request to `http://localhost:5000/api/chat-voice`
- **Body Type**: `form-data`
- **Key**: `audio` (Type: File)
- **Value**: Select an `.mp3`, `.wav`, or `.ogg` recording of a medical query in a regional language.
- **Key (Optional)**: `location` (Type: Text)
- **Value (Optional)**: E.g., `Wardha, Maharashtra`. Providing this will automatically fetch nearby clinics via OpenStreetMap and include them in the AI response!

### Example Response
```json
{
    "user_query": "मलेरिया से बचने के उपाय क्या हैं?",
    "ai_response": "नमस्ते, मैंने सुना कि आप पूछ रहे हैं: \"मलेरिया से बचने के उपाय क्या हैं?\"। हमारे डेटाबेस के अनुसार...",
    "audio_url": "http://localhost:5000/uploads/response_163989123.mp3"
}
```
