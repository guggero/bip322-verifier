//go:build js && wasm

// Build with:
//
//	build-wrapper.sh

package main

import (
	"fmt"
	"syscall/js"

	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/btcutil/bip322"
	"github.com/btcsuite/btcd/chaincfg"
)

// networkParams maps network name strings to their chaincfg.Params.
var networkParams = map[string]*chaincfg.Params{
	"mainnet":  &chaincfg.MainNetParams,
	"testnet":  &chaincfg.TestNet3Params,
	"testnet3": &chaincfg.TestNet3Params,
	"testnet4": &chaincfg.TestNet4Params,
	"signet":   &chaincfg.SigNetParams,
	"regtest":  &chaincfg.RegressionNetParams,
	"simnet":   &chaincfg.SimNetParams,
}

// verifyMessage is the JS-callable wrapper around bip322.VerifyMessage.
//
// Arguments: message (string), address (string), signature (string),
// [network (string, default "mainnet")]
//
// Returns: { valid: bool, error?: string }
func verifyMessage(_ js.Value, args []js.Value) any {
	if len(args) < 3 {
		return map[string]any{
			"valid": false,
			"error": "expected at least 3 arguments: " +
				"message, address, signature",
		}
	}

	message := args[0].String()
	addrStr := args[1].String()
	sig := args[2].String()

	network := "mainnet"
	if len(args) > 3 && args[3].Type() == js.TypeString {
		network = args[3].String()
	}

	params, ok := networkParams[network]
	if !ok {
		return map[string]any{
			"valid": false,
			"error": fmt.Sprintf("unknown network: %s", network),
		}
	}

	addr, err := btcutil.DecodeAddress(addrStr, params)
	if err != nil {
		return map[string]any{
			"valid": false,
			"error": fmt.Sprintf(
				"error decoding address: %s", err,
			),
		}
	}

	valid, err := bip322.VerifyMessage(message, addr, sig)
	result := map[string]any{"valid": valid}
	if err != nil {
		result["error"] = err.Error()
	}

	return result
}

func main() {
	js.Global().Set("bip322", map[string]any{
		"verifyMessage": js.FuncOf(verifyMessage),
	})

	// If a ready callback was registered, call it to signal that the
	// WASM module has finished initializing.
	if cb := js.Global().Get("onBip322Ready"); cb.Type() == js.TypeFunction {
		cb.Invoke()
	}

	// Block forever to keep the Go runtime alive.
	select {}
}
