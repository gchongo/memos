package v1

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/usememos/memos/internal/profile"
)

func TestSaveVideoThumbnailCache(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	profile := &profile.Profile{Data: dir}
	uid := "video123"
	data := []byte{0xFF, 0xD8, 0xFF, 0xDB, 0x00, 0x43, 0x00}

	require.NoError(t, saveVideoThumbnailCache(profile, uid, data))

	cachePath := filepath.Join(dir, attachmentThumbnailCacheFolder, uid+".jpeg")
	saved, err := os.ReadFile(cachePath)
	require.NoError(t, err)
	require.Equal(t, data, saved)
}

func TestSaveVideoThumbnailCacheRejectsInvalidJPEG(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	profile := &profile.Profile{Data: dir}

	err := saveVideoThumbnailCache(profile, "video123", []byte("not-a-jpeg"))
	require.Error(t, err)
}
