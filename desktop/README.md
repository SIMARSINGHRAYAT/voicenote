# Voice Note MSIX

This wrapper opens the deployed Voice Note app at `https://voicenote-mocha.vercel.app` in Microsoft Edge WebView2 and allows microphone permission only for that origin.

## Build

From the repository root, run:

```powershell
.\desktop\build-msix.ps1
```

Output is written to `desktop\out\VoiceNote.msix`.

The target machine needs the Microsoft Edge WebView2 Runtime. The package is signed with a local development certificate by default; install `desktop\out\VoiceNote.cer` into Trusted People before installing the MSIX on another machine. For Store or enterprise distribution, replace the development certificate with a trusted signing certificate.
