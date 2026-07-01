package fileserver

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/pkg/errors"

	storepb "github.com/usememos/memos/proto/gen/store"
	"github.com/usememos/memos/store"
)

const (
	videoThumbnailSeekSeconds = 0.1
	videoThumbnailTimeout     = 45 * time.Second
	maxVideoThumbnailBytes    = 512 << 10
)

var (
	errVideoThumbnailUnavailable = errors.New("video thumbnail unavailable")
	errFFmpegNotAvailable        = errors.New("ffmpeg not available")

	ffmpegOnce sync.Once
	ffmpegBin  string
	ffmpegErr  error
)

func resolveFFmpegBinary() (string, error) {
	ffmpegOnce.Do(func() {
		ffmpegBin, ffmpegErr = exec.LookPath("ffmpeg")
	})
	if ffmpegErr != nil {
		return "", errFFmpegNotAvailable
	}
	return ffmpegBin, nil
}

func (s *FileServerService) getOrGenerateVideoThumbnail(ctx context.Context, attachment *store.Attachment) ([]byte, error) {
	thumbnailPath, err := s.getThumbnailPath(attachment)
	if err != nil {
		return nil, err
	}

	if blob, err := s.readCachedThumbnail(thumbnailPath); err == nil {
		return blob, nil
	}

	legacyPath := filepath.Join(s.Profile.Data, ThumbnailCacheFolder, attachment.UID+".jpeg")
	if blob, err := s.readCachedThumbnail(legacyPath); err == nil {
		return blob, nil
	}

	if err := s.thumbnailSemaphore.Acquire(ctx, 1); err != nil {
		return nil, errors.Wrap(err, "failed to acquire thumbnail semaphore")
	}
	defer s.thumbnailSemaphore.Release(1)

	if blob, err := s.readCachedThumbnail(thumbnailPath); err == nil {
		return blob, nil
	}
	if blob, err := s.readCachedThumbnail(legacyPath); err == nil {
		return blob, nil
	}

	return s.generateVideoThumbnail(ctx, attachment, thumbnailPath)
}

func (s *FileServerService) generateVideoThumbnail(ctx context.Context, attachment *store.Attachment, thumbnailPath string) ([]byte, error) {
	ffmpeg, err := resolveFFmpegBinary()
	if err != nil {
		return nil, errVideoThumbnailUnavailable
	}

	input, cleanup, err := s.resolveFFmpegInput(ctx, attachment)
	if err != nil {
		return nil, errors.Wrap(err, "failed to resolve ffmpeg input")
	}
	if cleanup != nil {
		defer cleanup()
	}

	runCtx, cancel := context.WithTimeout(ctx, videoThumbnailTimeout)
	defer cancel()

	args := []string{
		"-hide_banner",
		"-loglevel", "error",
		"-nostdin",
	}
	if attachment.StorageType == storepb.AttachmentStorageType_S3 {
		args = append(args, "-protocol_whitelist", "file,http,https,tcp,tls,crypto")
	}
	args = append(args,
		"-ss", fmt.Sprintf("%.3f", videoThumbnailSeekSeconds),
		"-i", input,
		"-frames:v", "1",
		"-vf", fmt.Sprintf("scale=%d:-2", thumbnailMaxSize),
		"-q:v", "5",
		"-y",
		thumbnailPath,
	)

	cmd := exec.CommandContext(runCtx, ffmpeg, args...)
	if output, err := cmd.CombinedOutput(); err != nil {
		_ = os.Remove(thumbnailPath)
		return nil, errors.Wrapf(err, "ffmpeg failed: %s", strings.TrimSpace(string(output)))
	}

	blob, err := s.readCachedThumbnail(thumbnailPath)
	if err != nil {
		return nil, errors.Wrap(err, "failed to read generated video thumbnail")
	}
	if len(blob) == 0 || len(blob) > maxVideoThumbnailBytes {
		_ = os.Remove(thumbnailPath)
		return nil, errVideoThumbnailUnavailable
	}
	if len(blob) < 3 || blob[0] != 0xFF || blob[1] != 0xD8 || blob[2] != 0xFF {
		_ = os.Remove(thumbnailPath)
		return nil, errVideoThumbnailUnavailable
	}

	return blob, nil
}

func (s *FileServerService) resolveFFmpegInput(ctx context.Context, attachment *store.Attachment) (input string, cleanup func(), err error) {
	switch attachment.StorageType {
	case storepb.AttachmentStorageType_LOCAL:
		path, err := s.resolveLocalPath(attachment.Reference)
		if err != nil {
			return "", nil, err
		}
		return path, nil, nil

	case storepb.AttachmentStorageType_S3:
		url, err := s.getS3PresignedURL(ctx, attachment)
		if err != nil {
			return "", nil, err
		}
		return url, nil, nil

	default:
		reader, err := s.getAttachmentReader(ctx, attachment)
		if err != nil {
			return "", nil, err
		}
		defer reader.Close()

		ext := filepath.Ext(attachment.Filename)
		if ext == "" {
			ext = ".bin"
		}
		tmp, err := os.CreateTemp("", "memos-video-*"+ext)
		if err != nil {
			return "", nil, errors.Wrap(err, "failed to create temp video file")
		}

		if _, err := io.Copy(tmp, reader); err != nil {
			_ = tmp.Close()
			_ = os.Remove(tmp.Name())
			return "", nil, errors.Wrap(err, "failed to copy video to temp file")
		}
		if err := tmp.Close(); err != nil {
			_ = os.Remove(tmp.Name())
			return "", nil, errors.Wrap(err, "failed to finalize temp video file")
		}

		return tmp.Name(), func() { _ = os.Remove(tmp.Name()) }, nil
	}
}
