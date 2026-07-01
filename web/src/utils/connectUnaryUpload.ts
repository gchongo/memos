import { fromBinary, type Message, toBinary } from "@bufbuild/protobuf";
import type { GenMessage } from "@bufbuild/protobuf/codegenv2";
import { getRequestToken } from "@/connect";

const CONNECT_TIMEOUT_MS = 600_000;

export function encodeConnectEnvelope(messageBytes: Uint8Array): Uint8Array {
  const envelope = new Uint8Array(5 + messageBytes.length);
  envelope[0] = 0;
  new DataView(envelope.buffer).setUint32(1, messageBytes.length, false);
  envelope.set(messageBytes, 5);
  return envelope;
}

export function decodeConnectEnvelope(buffer: ArrayBuffer): Uint8Array {
  const view = new Uint8Array(buffer);
  if (view.length === 0) {
    throw new Error("Empty response");
  }

  if (view[0] === 0x7b) {
    const payload = JSON.parse(new TextDecoder().decode(view)) as { message?: string };
    throw new Error(payload.message ?? "Request failed");
  }

  const length = new DataView(view.buffer, view.byteOffset + 1, 4).getUint32(0, false);
  return view.subarray(5, 5 + length);
}

export async function sendConnectUpload<TRes extends Message>(
  procedure: string,
  responseSchema: GenMessage<TRes>,
  body: Uint8Array,
  onUploadProgress?: (loaded: number, total: number) => void,
): Promise<TRes> {
  const token = await getRequestToken();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${window.location.origin}${procedure}`);
    xhr.responseType = "arraybuffer";
    xhr.withCredentials = true;
    xhr.timeout = CONNECT_TIMEOUT_MS;
    xhr.setRequestHeader("Content-Type", "application/connect+proto");
    xhr.setRequestHeader("Accept", "application/connect+proto");
    xhr.setRequestHeader("Connect-Protocol-Version", "1");
    xhr.setRequestHeader("Connect-Timeout-Ms", String(CONNECT_TIMEOUT_MS));
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    if (onUploadProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onUploadProgress(event.loaded, event.total);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const responseBytes = decodeConnectEnvelope(xhr.response as ArrayBuffer);
          resolve(fromBinary(responseSchema, responseBytes) as TRes);
        } catch (error) {
          reject(error instanceof Error ? error : new Error("Failed to parse upload response"));
        }
        return;
      }

      if (xhr.response instanceof ArrayBuffer && xhr.response.byteLength > 0) {
        try {
          const payload = JSON.parse(new TextDecoder().decode(xhr.response)) as { message?: string };
          reject(new Error(payload.message ?? `Upload failed (${xhr.status})`));
          return;
        } catch {
          // Fall through to generic error.
        }
      }

      reject(new Error(`Upload failed (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));
    xhr.send(new Blob([body], { type: "application/connect+proto" }));
  });
}

export async function connectUnaryUpload<TReq extends Message, TRes extends Message>(
  procedure: string,
  requestSchema: GenMessage<TReq>,
  responseSchema: GenMessage<TRes>,
  request: TReq,
  onUploadProgress?: (loaded: number, total: number) => void,
): Promise<TRes> {
  const messageBytes = toBinary(requestSchema, request);
  const body = encodeConnectEnvelope(messageBytes);
  return sendConnectUpload(procedure, responseSchema, body, onUploadProgress);
}
