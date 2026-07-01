package v1

import (
	"os"
	"path/filepath"

	"github.com/pkg/errors"

	"github.com/usememos/memos/internal/profile"
)

const (
	attachmentThumbnailCacheFolder = ".thumbnail_cache"
	maxVideoThumbnailBytes         = 512 << 10
)

func saveVideoThumbnailCache(profile *profile.Profile, uid string, data []byte) error {
	if len(data) < 3 || data[0] != 0xFF || data[1] != 0xD8 || data[2] != 0xFF {
		return errors.New("video thumbnail must be JPEG")
	}
	if len(data) > maxVideoThumbnailBytes {
		return errors.Errorf("video thumbnail exceeds %d bytes", maxVideoThumbnailBytes)
	}

	cacheDir := filepath.Join(profile.Data, attachmentThumbnailCacheFolder)
	if err := os.MkdirAll(cacheDir, 0o755); err != nil {
		return errors.Wrap(err, "failed to create thumbnail cache folder")
	}

	cachePath := filepath.Join(cacheDir, uid+".v2.jpeg")
	if err := os.WriteFile(cachePath, data, 0o644); err != nil {
		return errors.Wrap(err, "failed to write video thumbnail cache")
	}

	// Remove legacy filename written by an earlier version.
	_ = os.Remove(filepath.Join(cacheDir, uid+".jpeg"))

	return nil
}
