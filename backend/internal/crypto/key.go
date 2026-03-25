package crypto

import (
	"encoding/hex"
	"errors"
	"os"
)

// AppKey is the loaded encryption key. Set by LoadKey() at startup.
var AppKey []byte

// LoadKey reads ENCRYPTION_KEY from the environment and validates it.
// Must be called once at startup before any encrypt/decrypt operations.
func LoadKey() error {
	raw := os.Getenv("ENCRYPTION_KEY")
	if raw == "" {
		return errors.New("ENCRYPTION_KEY environment variable is not set")
	}
	key, err := hex.DecodeString(raw)
	if err != nil {
		return errors.New("ENCRYPTION_KEY must be a valid hex string")
	}
	if len(key) != 32 {
		return errors.New("ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)")
	}
	AppKey = key
	return nil
}
