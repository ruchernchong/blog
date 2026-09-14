package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/zalando/go-keyring"
)

const (
	oauthIssuer      = "https://ruchern.dev"
	oauthResource    = "https://ruchern.dev/api/auth"
	oauthScopes      = "openid profile email offline_access mcp"
	oauthRedirectURI = "http://127.0.0.1:8741/callback"
	oauthListenAddr  = "127.0.0.1:8741"
	oauthClientName  = "usage-ingest"
	keyringService   = "dev.ruchern.usage-ingest"
	keyringAccount   = "oauth-tokens"
)

type oauthTokens struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token,omitempty"`
	ExpiryUnix   int64  `json:"expiry_unix"`
	ClientID     string `json:"client_id"`
	Email        string `json:"email,omitempty"`
}

func login() error {
	cfg, err := discoverOIDC()
	if err != nil {
		return err
	}
	clientID, err := loadOrRegisterClient(cfg.RegistrationEndpoint)
	if err != nil {
		return err
	}

	verifier, challenge, err := pkce()
	if err != nil {
		return err
	}
	state, err := randomB64(16)
	if err != nil {
		return err
	}

	authURL := cfg.AuthorizationEndpoint + "?" + url.Values{
		"response_type":         {"code"},
		"client_id":             {clientID},
		"redirect_uri":          {oauthRedirectURI},
		"scope":                 {oauthScopes},
		"state":                 {state},
		"code_challenge":        {challenge},
		"code_challenge_method": {"S256"},
		"resource":              {oauthResource},
	}.Encode()

	code, err := waitForCode(authURL, state)
	if err != nil {
		if isInvalidTarget(err) {
			_ = os.Remove(clientIDPath())
			return fmt.Errorf("%w (cached client dropped — run login again)", err)
		}
		return err
	}

	tokens, err := exchangeCode(cfg.TokenEndpoint, clientID, code, verifier)
	if err != nil {
		return err
	}
	tokens.ClientID = clientID
	if email, userErr := fetchEmail(cfg.UserinfoEndpoint, tokens.AccessToken); userErr == nil {
		tokens.Email = email
	}
	if err := saveTokens(tokens); err != nil {
		return err
	}
	if tokens.Email != "" {
		fmt.Printf("Signed in as %s. Ingest requires an admin account.\n", tokens.Email)
	} else {
		fmt.Println("Signed in. Ingest requires an admin account.")
	}
	return nil
}

func logout() error {
	_ = os.Remove(clientIDPath())
	err := keyring.Delete(keyringService, keyringAccount)
	if err != nil && !errors.Is(err, keyring.ErrNotFound) {
		return err
	}
	fmt.Println("Signed out.")
	return nil
}

func bearerToken() (string, error) {
	// Better Auth rotates refresh tokens and revokes the whole family on reuse,
	// so two runs refreshing with the same token (the 15-minute LaunchAgent and a
	// manual run) would both be signed out. Hold a lock across load, refresh
	// and save so the second run reads the token the first one saved.
	unlock, err := lockTokens()
	if err != nil {
		return "", err
	}
	defer unlock()

	tokens, err := loadTokens()
	if err != nil {
		return "", err
	}
	if tokens.AccessToken != "" && time.Now().Unix() < tokens.ExpiryUnix {
		return tokens.AccessToken, nil
	}
	if tokens.RefreshToken == "" {
		return "", errors.New("not signed in — run: usage-ingest login")
	}
	cfg, err := discoverOIDC()
	if err != nil {
		return "", err
	}
	refreshed, err := refreshTokens(cfg.TokenEndpoint, tokens)
	if err != nil {
		return "", fmt.Errorf("token refresh failed (%w) — run: usage-ingest login", err)
	}
	if err := saveTokens(refreshed); err != nil {
		return "", err
	}
	return refreshed.AccessToken, nil
}

type oidcDiscovery struct {
	AuthorizationEndpoint string `json:"authorization_endpoint"`
	TokenEndpoint         string `json:"token_endpoint"`
	RegistrationEndpoint  string `json:"registration_endpoint"`
	UserinfoEndpoint      string `json:"userinfo_endpoint"`
}

func discoverOIDC() (oidcDiscovery, error) {
	fallback := oidcDiscovery{
		AuthorizationEndpoint: oauthIssuer + "/api/auth/oauth2/authorize",
		TokenEndpoint:         oauthIssuer + "/api/auth/oauth2/token",
		RegistrationEndpoint:  oauthIssuer + "/api/auth/oauth2/register",
		UserinfoEndpoint:      oauthIssuer + "/api/auth/oauth2/userinfo",
	}
	req, err := http.NewRequest(http.MethodGet, oauthIssuer+"/api/auth/.well-known/openid-configuration", nil)
	if err != nil {
		return fallback, nil
	}
	req.Header.Set("Origin", oauthIssuer)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fallback, nil
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fallback, nil
	}
	var cfg oidcDiscovery
	if json.NewDecoder(resp.Body).Decode(&cfg) != nil || cfg.AuthorizationEndpoint == "" {
		return fallback, nil
	}
	if cfg.RegistrationEndpoint == "" {
		cfg.RegistrationEndpoint = fallback.RegistrationEndpoint
	}
	return cfg, nil
}

func loadOrRegisterClient(registerURL string) (string, error) {
	if id, err := os.ReadFile(clientIDPath()); err == nil {
		idStr := strings.TrimSpace(string(id))
		if idStr != "" {
			return idStr, nil
		}
	}
	body, _ := json.Marshal(map[string]any{
		"client_name":                oauthClientName,
		"application_type":           "native",
		"token_endpoint_auth_method": "none",
		"redirect_uris":              []string{oauthRedirectURI},
		"grant_types":                []string{"authorization_code", "refresh_token"},
		"response_types":             []string{"code"},
		"scope":                      oauthScopes,
		"resources":                  []string{oauthResource},
	})
	req, err := http.NewRequest(http.MethodPost, registerURL, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("content-type", "application/json")
	req.Header.Set("Origin", oauthIssuer)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("client registration %d: %s", resp.StatusCode, strings.TrimSpace(string(raw)))
	}
	var out struct {
		ClientID string `json:"client_id"`
	}
	if err := json.Unmarshal(raw, &out); err != nil || out.ClientID == "" {
		return "", fmt.Errorf("client registration: missing client_id")
	}
	if err := os.MkdirAll(filepath.Dir(clientIDPath()), 0o700); err != nil {
		return "", err
	}
	if err := os.WriteFile(clientIDPath(), []byte(out.ClientID+"\n"), 0o600); err != nil {
		return "", err
	}
	return out.ClientID, nil
}

func waitForCode(authURL, state string) (string, error) {
	ln, err := net.Listen("tcp", oauthListenAddr)
	if err != nil {
		return "", fmt.Errorf("listen %s: %w (is another login in progress?)", oauthListenAddr, err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	type outcome struct {
		code string
		err  error
	}
	done := make(chan outcome, 1)
	mux := http.NewServeMux()
	mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		if errParam := q.Get("error"); errParam != "" {
			msg := errParam
			if desc := q.Get("error_description"); desc != "" {
				msg += ": " + desc
			}
			fmt.Fprint(w, "Sign-in failed. You can close this tab.")
			done <- outcome{err: errors.New(msg)}
			return
		}
		if q.Get("state") != state {
			http.Error(w, "state mismatch", http.StatusBadRequest)
			done <- outcome{err: errors.New("oauth state mismatch")}
			return
		}
		code := q.Get("code")
		if code == "" {
			http.Error(w, "missing code", http.StatusBadRequest)
			done <- outcome{err: errors.New("oauth missing code")}
			return
		}
		fmt.Fprint(w, "Signed in. You can close this tab.")
		done <- outcome{code: code}
	})
	srv := &http.Server{Handler: mux, ReadHeaderTimeout: 10 * time.Second}
	go srv.Serve(ln)
	defer func() {
		shutCtx, shutCancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer shutCancel()
		_ = srv.Shutdown(shutCtx)
		_ = ln.Close()
	}()

	fmt.Println("Opening the browser to sign in…")
	if err := exec.Command("open", authURL).Start(); err != nil {
		fmt.Println(authURL)
	}

	select {
	case <-ctx.Done():
		return "", errors.New("login timed out")
	case out := <-done:
		return out.code, out.err
	}
}

func exchangeCode(tokenURL, clientID, code, verifier string) (oauthTokens, error) {
	return postToken(tokenURL, url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {code},
		"redirect_uri":  {oauthRedirectURI},
		"client_id":     {clientID},
		"code_verifier": {verifier},
		"resource":      {oauthResource},
	}, clientID)
}

func refreshTokens(tokenURL string, existing oauthTokens) (oauthTokens, error) {
	tokens, err := postToken(tokenURL, url.Values{
		"grant_type":    {"refresh_token"},
		"refresh_token": {existing.RefreshToken},
		"client_id":     {existing.ClientID},
		"resource":      {oauthResource},
	}, existing.ClientID)
	if err != nil {
		return oauthTokens{}, err
	}
	if tokens.RefreshToken == "" {
		tokens.RefreshToken = existing.RefreshToken
	}
	tokens.Email = existing.Email
	return tokens, nil
}

func postToken(tokenURL string, form url.Values, clientID string) (oauthTokens, error) {
	req, err := http.NewRequest(http.MethodPost, tokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return oauthTokens{}, err
	}
	req.Header.Set("content-type", "application/x-www-form-urlencoded")
	req.Header.Set("Origin", oauthIssuer)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return oauthTokens{}, err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return oauthTokens{}, fmt.Errorf("token endpoint %d: %s", resp.StatusCode, strings.TrimSpace(string(raw)))
	}
	var parsed struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		ExpiresIn    int64  `json:"expires_in"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return oauthTokens{}, err
	}
	if parsed.AccessToken == "" {
		return oauthTokens{}, errors.New("token endpoint: missing access_token")
	}
	expiresIn := parsed.ExpiresIn
	if expiresIn <= 0 {
		expiresIn = 3600
	}
	return oauthTokens{
		AccessToken:  parsed.AccessToken,
		RefreshToken: parsed.RefreshToken,
		ExpiryUnix:   time.Now().Unix() + expiresIn - 60,
		ClientID:     clientID,
	}, nil
}

func fetchEmail(userinfoURL, accessToken string) (string, error) {
	if userinfoURL == "" {
		return "", errors.New("no userinfo")
	}
	req, err := http.NewRequest(http.MethodGet, userinfoURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("authorization", "Bearer "+accessToken)
	req.Header.Set("Origin", oauthIssuer)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var body struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return "", err
	}
	return body.Email, nil
}

func saveTokens(tokens oauthTokens) error {
	raw, err := json.Marshal(tokens)
	if err != nil {
		return err
	}
	return keyring.Set(keyringService, keyringAccount, string(raw))
}

func loadTokens() (oauthTokens, error) {
	raw, err := keyring.Get(keyringService, keyringAccount)
	if err != nil {
		if errors.Is(err, keyring.ErrNotFound) {
			return oauthTokens{}, errors.New("not signed in — run: usage-ingest login")
		}
		return oauthTokens{}, err
	}
	var tokens oauthTokens
	if err := json.Unmarshal([]byte(raw), &tokens); err != nil {
		return oauthTokens{}, err
	}
	return tokens, nil
}

func clientIDPath() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".config", "ruchern", "usage-ingest-client-id")
}

// lockTokens takes an exclusive advisory lock shared by every usage-ingest
// process, blocking until any in-flight refresh has saved its tokens.
func lockTokens() (func(), error) {
	path := filepath.Join(filepath.Dir(clientIDPath()), "usage-ingest.lock")
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return nil, err
	}
	file, err := os.OpenFile(path, os.O_CREATE|os.O_RDWR, 0o600)
	if err != nil {
		return nil, err
	}
	if err := syscall.Flock(int(file.Fd()), syscall.LOCK_EX); err != nil {
		file.Close()
		return nil, fmt.Errorf("lock %s: %w", path, err)
	}
	return func() {
		_ = syscall.Flock(int(file.Fd()), syscall.LOCK_UN)
		_ = file.Close()
	}, nil
}

func pkce() (verifier, challenge string, err error) {
	verifier, err = randomB64(32)
	if err != nil {
		return "", "", err
	}
	sum := sha256.Sum256([]byte(verifier))
	challenge = base64.RawURLEncoding.EncodeToString(sum[:])
	return verifier, challenge, nil
}

func randomB64(n int) (string, error) {
	buf := make([]byte, n)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

func isInvalidTarget(err error) bool {
	return err != nil && strings.Contains(err.Error(), "invalid_target")
}
