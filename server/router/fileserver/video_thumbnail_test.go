package fileserver

import (
	"os/exec"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/usememos/memos/internal/profile"
	storepb "github.com/usememos/memos/proto/gen/store"
	"github.com/usememos/memos/store"
)

func TestGenerateVideoThumbnailFromLocalFile(t *testing.T) {
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		t.Skip("ffmpeg not installed")
	}

	dir := t.TempDir()
	videoPath := filepath.Join(dir, "sample.mp4")
	require.NoError(t, exec.Command("ffmpeg",
		"-hide_banner", "-loglevel", "error", "-nostdin",
		"-f", "lavfi", "-i", "color=c=blue:s=320x240:d=1",
		"-c:v", "libx264", "-pix_fmt", "yuv420p", "-y", videoPath,
	).Run())

	fs := NewFileServerService(&profile.Profile{Data: dir}, nil, "secret")
	attachment := &store.Attachment{
		UID:         "video-test",
		Filename:    "sample.mp4",
		Type:        "video/mp4",
		StorageType: storepb.AttachmentStorageType_LOCAL,
		Reference:   videoPath,
	}

	blob, err := fs.getOrGenerateVideoThumbnail(t.Context(), attachment)
	require.NoError(t, err)
	require.NotEmpty(t, blob)
	require.Equal(t, byte(0xFF), blob[0])
	require.Equal(t, byte(0xD8), blob[1])

	// Cached path should hit without regenerating.
	blobAgain, err := fs.getOrGenerateVideoThumbnail(t.Context(), attachment)
	require.NoError(t, err)
	require.Equal(t, blob, blobAgain)
}

func TestGetOrGenerateVideoThumbnailWithoutFFmpeg(t *testing.T) {
	originalBin := ffmpegBin
	originalErr := ffmpegErr
	ffmpegBin = ""
	ffmpegErr = errFFmpegNotAvailable
	t.Cleanup(func() {
		ffmpegBin = originalBin
		ffmpegErr = originalErr
	})

	dir := t.TempDir()
	fs := NewFileServerService(&profile.Profile{Data: dir}, nil, "secret")
	attachment := &store.Attachment{
		UID:         "missing-thumb",
		Filename:    "clip.mp4",
		Type:        "video/mp4",
		StorageType: storepb.AttachmentStorageType_LOCAL,
		Reference:   filepath.Join(dir, "missing.mp4"),
	}

	_, err := fs.getOrGenerateVideoThumbnail(t.Context(), attachment)
	require.ErrorIs(t, err, errVideoThumbnailUnavailable)
}
