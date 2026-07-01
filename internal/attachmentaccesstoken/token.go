package attachmentaccesstoken

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const (
	QueryParamName = "file_token"
	TokenTTL       = 24 * time.Hour
)

// Sign creates a short-lived HMAC token for attachment file access.
func Sign(uid string, expiresAt time.Time, secret string) string {
	payload := fmt.Sprintf("%s:%d", uid, expiresAt.Unix())
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(payload))
	signature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	encodedPayload := base64.RawURLEncoding.EncodeToString([]byte(payload))
	return encodedPayload + "." + signature
}

// Verify checks that a token matches the attachment UID and has not expired.
func Verify(token, uid, secret string) bool {
	payload, ok := parseSignedToken(token, secret)
	if !ok {
		return false
	}

	tokenUID, expiresUnix, ok := parsePayload(payload)
	if !ok || tokenUID != uid {
		return false
	}

	return time.Now().Unix() <= expiresUnix
}

// BuildSignedRelativePath returns a same-origin relative file URL with an access token.
func BuildSignedRelativePath(uid, filename, secret string) string {
	token := Sign(uid, time.Now().Add(TokenTTL), secret)
	return fmt.Sprintf("/file/attachments/%s/%s?%s=%s", uid, url.PathEscape(filename), QueryParamName, url.QueryEscape(token))
}

func parseSignedToken(token, secret string) (string, bool) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return "", false
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", false
	}
	payload := string(payloadBytes)

	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(payload))
	expected := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(parts[1]), []byte(expected)) {
		return "", false
	}

	return payload, true
}

func parsePayload(payload string) (uid string, expiresUnix int64, ok bool) {
	uidPart, expiresPart, found := strings.Cut(payload, ":")
	if !found || uidPart == "" || expiresPart == "" {
		return "", 0, false
	}

	expiresUnix, err := strconv.ParseInt(expiresPart, 10, 64)
	if err != nil {
		return "", 0, false
	}

	return uidPart, expiresUnix, true
}
