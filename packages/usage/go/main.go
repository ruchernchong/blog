// Local usage collector: parse agent logs on this machine, optionally POST
// daily aggregates to POST /api/usage/ingest.
//
//	go run .              # measure (table + JSON stats)
//	go run . login        # OAuth (browser + Keychain)
//	go run . logout
//	go run . ingest       # POST rows (OAuth bearer; server prices)
package main

import (
	"fmt"
	"os"
)

func main() {
	cmd := "measure"
	args := os.Args[1:]
	if len(args) > 0 && !hasPrefix(args[0], "-") {
		cmd = args[0]
		args = args[1:]
	}
	_ = args

	switch cmd {
	case "login":
		if err := login(); err != nil {
			fatal("login: %v", err)
		}
		return
	case "logout":
		if err := logout(); err != nil {
			fatal("logout: %v", err)
		}
		return
	}

	home, err := os.UserHomeDir()
	if err != nil {
		fatal("home: %v", err)
	}

	result, err := collect(home)
	if err != nil {
		fatal("%v", err)
	}

	switch cmd {
	case "measure", "":
		printTable(result.Stats)
		fmt.Println()
		if err := encodeJSON(os.Stdout, measureResult{
			Agents:     result.Agents,
			EventCount: result.EventCount,
			Stats:      result.Stats,
		}); err != nil {
			fatal("json: %v", err)
		}
	case "ingest":
		if err := ingest(result); err != nil {
			fatal("ingest: %v", err)
		}
	default:
		fatal("unknown command %q (measure | login | logout | ingest)", cmd)
	}
}

func hasPrefix(s, prefix string) bool {
	return len(s) >= len(prefix) && s[:len(prefix)] == prefix
}

func fatal(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
