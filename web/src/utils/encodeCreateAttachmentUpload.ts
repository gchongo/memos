import type { MotionMedia } from "@/types/proto/api/v1/attachment_service_pb";
import { encodeConnectEnvelope } from "@/utils/connectUnaryUpload";

const WIRE_TYPE_VARINT = 0;
const WIRE_TYPE_LENGTH_DELIMITED = 2;
const FILE_COPY_CHUNK_SIZE = 1024 * 1024;

export const encodeVarint = (value: number | bigint): Uint8Array => {
  const bytes: number[] = [];
  let n = BigInt(value);

  while (n > 0x7fn) {
    bytes.push(Number((n & 0x7fn) | 0x80n));
    n >>= 7n;
  }
  bytes.push(Number(n));

  return new Uint8Array(bytes);
};

const fieldKey = (fieldNumber: number, wireType: number): number => (fieldNumber << 3) | wireType;

export const concatBytes = (...parts: Uint8Array[]): Uint8Array => {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
};

const encodeStringField = (fieldNumber: number, value: string): Uint8Array => {
  const encoded = new TextEncoder().encode(value);
  return concatBytes(encodeVarint(fieldKey(fieldNumber, WIRE_TYPE_LENGTH_DELIMITED)), encodeVarint(encoded.length), encoded);
};

const encodeBytesField = (fieldNumber: number, bytes: Uint8Array): Uint8Array =>
  concatBytes(encodeVarint(fieldKey(fieldNumber, WIRE_TYPE_LENGTH_DELIMITED)), encodeVarint(bytes.length), bytes);

const encodeBytesFieldHeader = (fieldNumber: number, byteLength: number): Uint8Array =>
  concatBytes(encodeVarint(fieldKey(fieldNumber, WIRE_TYPE_LENGTH_DELIMITED)), encodeVarint(byteLength));

const encodeVarintField = (fieldNumber: number, value: number | bigint): Uint8Array =>
  concatBytes(encodeVarint(fieldKey(fieldNumber, WIRE_TYPE_VARINT)), encodeVarint(value));

const encodeBoolField = (fieldNumber: number, value: boolean): Uint8Array => encodeVarintField(fieldNumber, value ? 1 : 0);

const encodeMessageField = (fieldNumber: number, inner: Uint8Array): Uint8Array =>
  concatBytes(encodeVarint(fieldKey(fieldNumber, WIRE_TYPE_LENGTH_DELIMITED)), encodeVarint(inner.length), inner);

const encodeMotionMedia = (motion: MotionMedia): Uint8Array =>
  concatBytes(
    encodeVarintField(1, motion.family),
    encodeVarintField(2, motion.role),
    encodeStringField(3, motion.groupId),
    encodeVarintField(4, motion.presentationTimestampUs),
    encodeBoolField(5, motion.hasEmbeddedVideo),
  );

const buildAttachmentLayout = (params: {
  filename: string;
  mimeType: string;
  fileSize: number;
  thumbnail?: Uint8Array;
  motionMedia?: MotionMedia;
}) => {
  const prefix = concatBytes(encodeStringField(3, params.filename), encodeBytesFieldHeader(4, params.fileSize));
  const suffixParts = [encodeStringField(6, params.mimeType)];

  if (params.motionMedia) {
    suffixParts.push(encodeMessageField(9, encodeMotionMedia(params.motionMedia)));
  }
  if (params.thumbnail && params.thumbnail.length > 0) {
    suffixParts.push(encodeBytesField(10, params.thumbnail));
  }

  const suffix = concatBytes(...suffixParts);

  return {
    prefix,
    contentOffset: prefix.length,
    suffix,
    attachmentSize: prefix.length + params.fileSize + suffix.length,
  };
};

const writeFileIntoBuffer = async (file: File, buffer: Uint8Array, offset: number): Promise<void> => {
  let position = 0;

  while (position < file.size) {
    const chunk = file.slice(position, position + FILE_COPY_CHUNK_SIZE);
    const bytes = new Uint8Array(await chunk.arrayBuffer());
    buffer.set(bytes, offset + position);
    position += bytes.length;
  }
};

export interface CreateAttachmentUploadInput {
  attachmentId: string;
  filename: string;
  mimeType: string;
  file: File;
  thumbnail?: Uint8Array;
  motionMedia?: MotionMedia;
}

/** Encode CreateAttachmentRequest into a Connect envelope with one allocation and chunked file copy. */
export const encodeCreateAttachmentUpload = async (params: CreateAttachmentUploadInput): Promise<Uint8Array> => {
  const layout = buildAttachmentLayout({
    filename: params.filename,
    mimeType: params.mimeType,
    fileSize: params.file.size,
    thumbnail: params.thumbnail,
    motionMedia: params.motionMedia,
  });

  const attachmentMessage = new Uint8Array(layout.attachmentSize);
  attachmentMessage.set(layout.prefix, 0);
  await writeFileIntoBuffer(params.file, attachmentMessage, layout.contentOffset);
  attachmentMessage.set(layout.suffix, layout.contentOffset + params.file.size);

  const requestMessage = concatBytes(encodeMessageField(1, attachmentMessage), encodeStringField(2, params.attachmentId));
  return encodeConnectEnvelope(requestMessage);
};

export const generateAttachmentUploadId = (): string => crypto.randomUUID();
