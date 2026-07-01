package attachmentaccesstoken

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestSignAndVerify(t *testing.T) {
	secret := "test-secret"
	uid := "video123"
	expires := time.Now().Add(time.Hour)

	token := Sign(uid, expires, secret)
	require.True(t, Verify(token, uid, secret))
	require.False(t, Verify(token, "other", secret))
	require.False(t, Verify(token, uid, "wrong-secret"))
}

func TestVerifyExpiredToken(t *testing.T) {
	secret := "test-secret"
	uid := "video123"
	token := Sign(uid, time.Now().Add(-time.Minute), secret)
	require.False(t, Verify(token, uid, secret))
}

func TestBuildSignedRelativePath(t *testing.T) {
	path := BuildSignedRelativePath("abc", "clip.mp4", "secret")
	require.Contains(t, path, "/file/attachments/abc/clip.mp4")
	require.Contains(t, path, QueryParamName+"=")
}
