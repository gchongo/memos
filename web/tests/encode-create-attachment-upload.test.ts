import { create, toBinary } from "@bufbuild/protobuf";
import { describe, expect, it } from "vitest";
import {
  AttachmentSchema,
  CreateAttachmentRequestSchema,
  MotionMediaFamily,
  MotionMediaRole,
  MotionMediaSchema,
} from "@/types/proto/api/v1/attachment_service_pb";
import { encodeConnectEnvelope } from "@/utils/connectUnaryUpload";
import { encodeCreateAttachmentUpload } from "@/utils/encodeCreateAttachmentUpload";

describe("encodeCreateAttachmentUpload", () => {
  it("matches protobuf encoding for a small attachment payload", async () => {
    const content = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0xff]);
    const thumbnail = new Uint8Array([0x10, 0x20]);
    const file = new File([content], "clip.mp4", { type: "video/mp4" });
    const attachmentId = "upload-test-id";

    const encoded = await encodeCreateAttachmentUpload({
      attachmentId,
      filename: file.name,
      mimeType: file.type,
      file,
      thumbnail,
      motionMedia: create(MotionMediaSchema, {
        family: MotionMediaFamily.APPLE_LIVE_PHOTO,
        role: MotionMediaRole.VIDEO,
        groupId: "group-1",
        presentationTimestampUs: 123n,
        hasEmbeddedVideo: true,
      }),
    });

    const expected = encodeConnectEnvelope(
      toBinary(
        CreateAttachmentRequestSchema,
        create(CreateAttachmentRequestSchema, {
          attachmentId,
          attachment: create(AttachmentSchema, {
            filename: file.name,
            type: file.type,
            content,
            thumbnail,
            motionMedia: create(MotionMediaSchema, {
              family: MotionMediaFamily.APPLE_LIVE_PHOTO,
              role: MotionMediaRole.VIDEO,
              groupId: "group-1",
              presentationTimestampUs: 123n,
              hasEmbeddedVideo: true,
            }),
          }),
        }),
      ),
    );

    expect(encoded).toEqual(expected);
  });
});
