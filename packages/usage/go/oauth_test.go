package main

import (
	"crypto/sha256"
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/zalando/go-keyring"
)

// s256 is the RFC 7636 S256 transform, checked against the spec's test vector
// below and then used to verify the challenge pkce() derives from its verifier.
func s256(verifier string) string {
	sum := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func TestS256MatchesRFC7636Vector(t *testing.T) {
	const (
		verifier  = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
		challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
	)
	if got := s256(verifier); got != challenge {
		t.Errorf("s256(RFC 7636 verifier) = %q, want %q", got, challenge)
	}
}

func TestPKCE(t *testing.T) {
	unreserved := regexp.MustCompile(`^[A-Za-z0-9\-._~]{43,128}$`)
	seen := map[string]struct{}{}
	for range 50 {
		verifier, challenge, err := pkce()
		if err != nil {
			t.Fatal(err)
		}
		if !unreserved.MatchString(verifier) {
			t.Errorf("verifier %q is not 43-128 unreserved characters", verifier)
		}
		if challenge != s256(verifier) {
			t.Errorf("challenge %q is not S256(%q)", challenge, verifier)
		}
		if len(challenge) != 43 || strings.ContainsAny(challenge, "+/=") {
			t.Errorf("challenge %q is not unpadded base64url SHA-256", challenge)
		}
		if _, dup := seen[verifier]; dup {
			t.Errorf("verifier %q repeated", verifier)
		}
		seen[verifier] = struct{}{}
	}
}

func TestRandomB64(t *testing.T) {
	tests := []struct {
		n       int
		wantLen int
	}{
		{16, 22},
		{32, 43},
	}
	for _, tt := range tests {
		seen := map[string]struct{}{}
		for range 50 {
			got, err := randomB64(tt.n)
			if err != nil {
				t.Fatal(err)
			}
			if len(got) != tt.wantLen {
				t.Errorf("randomB64(%d) length = %d, want %d", tt.n, len(got), tt.wantLen)
			}
			raw, err := base64.RawURLEncoding.DecodeString(got)
			if err != nil || len(raw) != tt.n {
				t.Errorf("randomB64(%d) = %q does not decode to %d bytes: %v", tt.n, got, tt.n, err)
			}
			if _, dup := seen[got]; dup {
				t.Errorf("randomB64(%d) repeated %q", tt.n, got)
			}
			seen[got] = struct{}{}
		}
	}
}

func TestIsInvalidTarget(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want bool
	}{
		{"nil", nil, false},
		{"invalid_target", errString("invalid_target: resource not allowed"), true},
		{"other error", errString("access_denied"), false},
	}
	for _, tt := range tests {
		if got := isInvalidTarget(tt.err); got != tt.want {
			t.Errorf("%s: isInvalidTarget = %v, want %v", tt.name, got, tt.want)
		}
	}
}

type errString string

func (e errString) Error() string { return string(e) }

func TestExchangeCodeSendsPKCEForm(t *testing.T) {
	var form url.Values
	var contentType, origin string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		contentType = r.Header.Get("content-type")
		origin = r.Header.Get("Origin")
		_ = r.ParseForm()
		form = r.PostForm
		_, _ = w.Write([]byte(`{"access_token":"access","refresh_token":"refresh","expires_in":600}`))
	}))
	defer srv.Close()

	before := time.Now().Unix()
	tokens, err := exchangeCode(srv.URL, "client-1", "code-1", "verifier-1")
	after := time.Now().Unix()
	if err != nil {
		t.Fatal(err)
	}
	if contentType != "application/x-www-form-urlencoded" || origin != oauthIssuer {
		t.Errorf("content-type = %q, origin = %q", contentType, origin)
	}
	wantForm := map[string]string{
		"grant_type":    "authorization_code",
		"code":          "code-1",
		"redirect_uri":  oauthRedirectURI,
		"client_id":     "client-1",
		"code_verifier": "verifier-1",
		"resource":      oauthResource,
	}
	for key, want := range wantForm {
		if got := form.Get(key); got != want {
			t.Errorf("form %s = %q, want %q", key, got, want)
		}
	}
	if tokens.AccessToken != "access" || tokens.RefreshToken != "refresh" || tokens.ClientID != "client-1" {
		t.Errorf("tokens = %+v", tokens)
	}
	if tokens.ExpiryUnix < before+540 || tokens.ExpiryUnix > after+540 {
		t.Errorf("expiry = %d, want expires_in minus 60s (%d..%d)", tokens.ExpiryUnix, before+540, after+540)
	}
}

func TestPostToken(t *testing.T) {
	tests := []struct {
		name        string
		status      int
		body        string
		wantErr     string
		wantExpires int64
	}{
		{"default expiry", http.StatusOK, `{"access_token":"a"}`, "", 3540},
		{"missing access token", http.StatusOK, `{"refresh_token":"r"}`, "missing access_token", 0},
		{"invalid JSON", http.StatusOK, `not json`, "invalid character", 0},
		{"error status", http.StatusBadRequest, `{"error":"invalid_grant"}`, `token endpoint 400: {"error":"invalid_grant"}`, 0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tt.status)
				_, _ = w.Write([]byte(tt.body))
			}))
			defer srv.Close()

			before := time.Now().Unix()
			tokens, err := postToken(srv.URL, url.Values{}, "client")
			after := time.Now().Unix()
			if tt.wantErr != "" {
				if err == nil || !strings.Contains(err.Error(), tt.wantErr) {
					t.Errorf("err = %v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			if tokens.ExpiryUnix < before+tt.wantExpires || tokens.ExpiryUnix > after+tt.wantExpires {
				t.Errorf("expiry = %d, want now+%d", tokens.ExpiryUnix, tt.wantExpires)
			}
		})
	}
}

func TestRefreshTokens(t *testing.T) {
	existing := oauthTokens{AccessToken: "old", RefreshToken: "old-refresh", ClientID: "client-1", Email: "me@example.com"}
	tests := []struct {
		name        string
		body        string
		wantRefresh string
	}{
		{"keeps refresh token when none returned", `{"access_token":"new"}`, "old-refresh"},
		{"rotates refresh token", `{"access_token":"new","refresh_token":"new-refresh"}`, "new-refresh"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var form url.Values
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				_ = r.ParseForm()
				form = r.PostForm
				_, _ = w.Write([]byte(tt.body))
			}))
			defer srv.Close()

			tokens, err := refreshTokens(srv.URL, existing)
			if err != nil {
				t.Fatal(err)
			}
			if form.Get("grant_type") != "refresh_token" || form.Get("refresh_token") != "old-refresh" || form.Get("client_id") != "client-1" || form.Get("resource") != oauthResource {
				t.Errorf("form = %v", form)
			}
			if tokens.AccessToken != "new" || tokens.RefreshToken != tt.wantRefresh || tokens.Email != existing.Email || tokens.ClientID != existing.ClientID {
				t.Errorf("tokens = %+v", tokens)
			}
		})
	}
}

func TestFetchEmail(t *testing.T) {
	var authorization string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authorization = r.Header.Get("authorization")
		_, _ = w.Write([]byte(`{"email":"me@example.com"}`))
	}))
	defer srv.Close()

	email, err := fetchEmail(srv.URL, "access")
	if err != nil || email != "me@example.com" {
		t.Errorf("fetchEmail = %q, %v", email, err)
	}
	if authorization != "Bearer access" {
		t.Errorf("authorization = %q", authorization)
	}
	if _, err := fetchEmail("", "access"); err == nil {
		t.Error("fetchEmail with no URL should fail")
	}
}

func TestBearerToken(t *testing.T) {
	now := time.Now().Unix()
	tests := []struct {
		name    string
		stored  string
		want    string
		wantErr string
	}{
		{"not signed in", "", "", "not signed in"},
		{"unexpired access token", `{"access_token":"access","expiry_unix":` + itoa(now+3600) + `}`, "access", ""},
		{"expired without refresh token", `{"access_token":"access","expiry_unix":` + itoa(now-1) + `}`, "", "not signed in"},
		{"corrupt keychain entry", `not json`, "", "invalid character"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("HOME", t.TempDir())
			keyring.MockInit()
			if tt.stored != "" {
				if err := keyring.Set(keyringService, keyringAccount, tt.stored); err != nil {
					t.Fatal(err)
				}
			}
			got, err := bearerToken()
			if tt.wantErr != "" {
				if err == nil || !strings.Contains(err.Error(), tt.wantErr) {
					t.Errorf("err = %v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil || got != tt.want {
				t.Errorf("bearerToken() = %q, %v; want %q", got, err, tt.want)
			}
		})
	}
}

func TestSaveLoadTokens(t *testing.T) {
	keyring.MockInit()
	want := oauthTokens{AccessToken: "a", RefreshToken: "r", ExpiryUnix: 123, ClientID: "c", Email: "e@example.com"}
	if err := saveTokens(want); err != nil {
		t.Fatal(err)
	}
	got, err := loadTokens()
	if err != nil || got != want {
		t.Errorf("loadTokens() = %+v, %v; want %+v", got, err, want)
	}
}

func itoa(n int64) string {
	return strconv.FormatInt(n, 10)
}
