/**
 * Edge-TTS client — Microsoft Azure Neural TTS via WebSocket.
 * Adapted from rany2/edge-tts (Python). No API key required.
 * Includes Sec-MS-GEC DRM token generation.
 */
import { createHash } from "crypto";
import { WebSocket } from "ws";

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const BASE_URL = "speech.platform.bing.com/consumer/speech/synthesize/readaloud";
const WS_URL = `wss://${BASE_URL}/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;

// Windows epoch offset (seconds between 1601-01-01 and 1970-01-01)
const WIN_EPOCH = 11644473600;

/**
 * Generate the Sec-MS-GEC DRM token (required by Microsoft).
 * Matches rany2/edge-tts Python implementation.
 */
function generateSecMsGec(): string {
  let ticks = Math.floor(Date.now() / 1000); // current unix timestamp
  ticks += WIN_EPOCH; // convert to Windows file time (seconds)
  ticks -= ticks % 300; // round down to nearest 5 minutes
  ticks *= 1e7; // convert to 100-nanosecond intervals (1e9 / 100)
  const strToHash = `${ticks}${TRUSTED_CLIENT_TOKEN}`;
  return createHash("sha256").update(strToHash, "ascii").digest("hex").toUpperCase();
}

function uuid(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

interface TtsOptions {
  voice?: string;
  rate?: string;
  pitch?: string;
  volume?: string;
}

/**
 * Generate MP3 audio from text using Microsoft Edge TTS.
 * Returns a Buffer containing audio/mpeg data.
 */
export function edgeTts(
  text: string,
  options: TtsOptions = {}
): Promise<Buffer> {
  const {
    voice = "en-US-AriaNeural",
    rate = "+0%",
    pitch = "+0Hz",
    volume = "+0%",
  } = options;

  return new Promise<Buffer>((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Edge-TTS timeout (15s)"));
    }, 15000);

    const secMsGec = generateSecMsGec();

    const ws = new WebSocket(
      `${WS_URL}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=1-143.0.3650.75&ConnectionId=${uuid()}`,
      {
        host: "speech.platform.bing.com",
        origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Accept-Language": "en-US,en;q=0.9",
          Pragma: "no-cache",
          "Cache-Control": "no-cache",
        },
      }
    );

    const audioChunks: Buffer[] = [];

    ws.on("message", (rawData: Buffer, isBinary: boolean) => {
      if (!isBinary) {
        const data = rawData.toString("utf8");
        if (data.includes("turn.end")) {
          clearTimeout(timeout);
          resolve(Buffer.concat(audioChunks));
          ws.close();
        }
        return;
      }

      const separator = "Path:audio\r\n";
      const idx = rawData.indexOf(separator);
      if (idx !== -1) {
        audioChunks.push(rawData.subarray(idx + separator.length));
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    ws.on("open", () => {
      const speechConfig = JSON.stringify({
        context: {
          synthesis: {
            audio: {
              metadataoptions: {
                sentenceBoundaryEnabled: false,
                wordBoundaryEnabled: false,
              },
              outputFormat: "audio-24khz-48kbitrate-mono-mp3",
            },
          },
        },
      });

      const configMsg =
        `X-Timestamp:${new Date().toISOString()}\r\n` +
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        speechConfig;

      ws.send(configMsg, { compress: true }, (configErr) => {
        if (configErr) {
          clearTimeout(timeout);
          return reject(configErr);
        }

        const ssmlMsg =
          `X-RequestId:${uuid()}\r\n` +
          `Content-Type:application/ssml+xml\r\n` +
          `X-Timestamp:${new Date().toISOString()}\r\n` +
          `Path:ssml\r\n\r\n` +
          `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
          `<voice name='${voice}'>` +
          `<prosody pitch='${pitch}' rate='${rate}' volume='${volume}'>` +
          `${text}` +
          `</prosody></voice></speak>`;

        ws.send(ssmlMsg, { compress: true }, (ssmlErr) => {
          if (ssmlErr) {
            clearTimeout(timeout);
            reject(ssmlErr);
          }
        });
      });
    });
  });
}
