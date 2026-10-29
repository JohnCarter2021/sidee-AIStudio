# Sidee as a proper cross-platform app — plan for review

**Status:** Draft for review — no code has been changed for this plan.
**Date:** 2026-10-29 (v3 — cross-platform plan, updated with all
improvements from the review on the same day; see “What changed in v3”
below)
**Base:** Fork `JohnCarter2021/Sidee`, main at commit `8058bab`
(“Fix quick-fixes bundle: macOS version, CLI launch, tile URL confirmation”)
**Upstream:** `Empi9245/Sidee`

## The idea in one paragraph

Turn Sidee from a source ZIP + launcher script + browser tab into a
proper app on every platform the user has: a double-click `.exe` on
Windows, an updated `.app` on macOS, a portable Linux build, and an
`.apk` on Android — all opening the same app window with the same
grid of apps that can be installed onto a VIDAA TV with one click
each. The TV protocol, pairing and safety rules stay exactly as they
are — only the packaging, the window and the app catalogue change.

One clarification up front, because it shapes the whole plan:
**cross-platform does not mean one binary that runs everywhere.**
It means one shared core and one shared dashboard, with a small
per-platform wrapper and package for each OS. Android is the one
platform where that wrapper is genuinely different, for reasons in §5.

## What changed in v3

All ten improvements from the review are folded into this version,
not just appended:

1. **Remote catalogue updates** (§6): a bundled catalogue as fallback,
   with an optional HTTPS catalogue fetch validated as data only —
   so a new app does not require rebuilding all four platforms.
2. **Multi-TV decision** (§3, §6, §11): the catalogue API takes a TV
   identifier from Phase 1, but v1 ships with one saved pairing plus
   a one-tap forget-and-pair-another flow. Multi-TV saved pairings
   are a later phase, not a silent v1 limitation.
3. **Migration** (§9, Phase 1): existing `~/.sidee/session.json`
   pairings and `presets_local.py` custom apps must import into the
   new app, with a migration test. No forced re-PIN for existing users.
4. **Diagnostics without telemetry** (§2, §9): a “Check my setup”
   step (network → SSDP → descriptor → port 36669 → PIN) and a
   redacted log export (dashboard key, tokens and PIN stripped) —
   the feedback loop that replaces analytics.
5. **Grid performance** (§6): render from the last known installed
   state instantly, refresh in the background, show staleness and a
   refresh button; installs queue per card with progress.
6. **Native mode decided** (§3, §12): native is excluded from the
   v1 grid and documented as such, instead of being left as a
   placeholder users can stumble into.
7. **Strings and accessibility early** (§9, Phase 1): dashboard
   strings externalised at grid-rewrite time, and keyboard /
   screen-reader behaviour on grid cards is a Phase 1 acceptance
   criterion, not Phase 4 polish.
8. **Trademark and icon check** (§7, §9, Phase 4): a legal/policy
   check for built-in names and icons before public release.
9. **Beta channel** (§7, §9, Phase 4/5): GitHub pre-releases as the
   beta channel, with an issue template asking for TV model,
   firmware and the redacted diagnostic log.
10. **Version mapping** (§7): one release version, mapped explicitly
    to Android versionCode, macOS marketing/build versions and
    Windows file version, so “0.1.5” does not become four different
    numbers by accident.

What was deliberately **not** added: ratings, an app-store review
process, or any phone-home analytics. Those would break the privacy
model, and the diagnostic export in point 4 provides the same
learning without them.

## My recommendation, up front

Do **not** rewrite Sidee. Keep the tested Python core
(`core/client.py`, `core/protocol.py`, `core/pairing.py`, `core/webui.py`)
and wrap it, in this order:

1. **Grid first, packages second.** Build the catalogue + grid
   dashboard first, because it is testable today with
   `python sidee.py`, it benefits every platform at once, and it is
   useful even before any packaging work.
2. **Desktop next, in order: Windows, then macOS, then Linux.**
   Windows is the new exe and the biggest audience; macOS already
   has a PyInstaller app to update; Linux needs one small core fix
   first (see §4) and then follows the same PyInstaller pattern.
3. **Android last, and only past a spike gate.** An Android APK
   that pairs a TV directly from a phone — no PC needed — is the
   most valuable new platform and also the hardest. Do not commit
   to a full Android build until a small spike proves the chosen
   approach works on a real phone (see §5). If the spike fails,
   Android is deferred rather than forced through a rewrite.
4. **One shared dashboard everywhere.** The grid, pairing flow and
   API are the same HTML/JS + HTTP-on-localhost on every platform.
   Only the window that shows it changes: WebView2 on Windows,
   WKWebView on macOS, WebKitGTK on Linux, Android WebView on
   Android, system browser as fallback everywhere.

## 1. Where Sidee is today

- Python-only, one runtime dependency (`paho-mqtt`). Source checkout
  runs with `python sidee.py`; the dashboard is a local web page on
  port 8787, protected by a random key in the URL.
- Windows today: a ZIP containing source + `start-windows.bat` /
  `start-windows.ps1`, which downloads pinned Python 3.13.16 and paho
  on first launch and verifies them with SHA-256. It works, but it
  is not an app: it needs extraction, a console window, and a
  first-run download.
- macOS today: a PyInstaller `Sidee.app` + small Tk control window,
  separate arm64 and x64 builds. This is the closest existing proof
  that the “proper app” shape works. It is unsigned/notarized and
  needs macOS 15+.
- Linux today: **not a supported target.** Source can run, but
  `platform_support.local_ipv4_interfaces` only handles macOS and
  Windows and returns an empty list on Linux, so discovery falls
  back to global broadcast/multicast only. There is no Linux
  package, spec, or CI job.
- Android today: **nothing.** There is no APK, no Android code,
  and no Android build in CI. The closest existing feature is the
  phone QR code, which opens the PC's dashboard in a phone browser
  — the phone is a remote control for a PC, not a standalone app.
- The dashboard today shows three fixed cards, not a grid: Nuvio,
  Stremio (community VIDAA build, optional server), Jellyfin (user's
  own server). There is no custom-app option, no installed-state
  display, and no launch-from-dashboard button — list/launch exist
  only in the CLI.
- TV flow today, unchanged by this plan: SSDP discovery on the LAN →
  PIN pairing over MQTT/TLS on port 36669 → session saved in
  `~/.sidee/session.json` → install/launch a web tile → verify by
  asking the TV for a fresh app list. No account, no cloud for the
  main flow, no telemetry.

## 2. What the finished app should feel like, on every platform

User journey, start to finish — the same on Windows, macOS, Linux
and Android, with only the download differing:

1. Download one thing for your device, open/install it. No Python,
   no admin rights (except the normal Android install prompt for a
   sideloaded APK), no console window.
2. The app window opens on its own. It shows the TV step first:
   **Find TV → Request code → enter the 4-digit PIN → Paired.**
   On Android, this is the whole point: the phone itself finds and
   pairs the TV, no PC in the room.
3. The main screen is a **grid of app cards**: icon, name, one-line
   description, category, and a button that reads **Install**,
   **Installed**, or **Open** depending on what the TV reports.
4. Cards that need a server (Jellyfin, Stremio with a server) ask for
   it inline on the card, once, and remember nothing sensitive beyond
   what the TV pairing already stores.
5. A search box and category filters sit above the grid. A **Custom
   app** card opens a form: name + URL + optional icon, validated
   the same way presets are today (https, or http only on the
   private LAN).
6. Closing the app stops the local dashboard. Tiles already installed
   stay on the TV, exactly as today. Reopening the app reconnects
   with the saved pairing; it does not ask for a PIN again unless the
   pairing has expired or been rejected.
7. “Runs anywhere” means, concretely, per platform:
   - Windows 10/11 64-bit, from any folder including a USB stick.
   - macOS 15+, Apple Silicon and Intel, from Applications.
   - Linux x86_64, from any folder, no install required (AppImage,
     see §4). ARM64 Linux is later, not v1.
   - Android phone/tablet on the same home Wi-Fi as the TV, installed
     from an APK file (sideload, see §5). No Google Play account
     required in v1.

Screens (all inside the one app window, on every platform):

- TV setup / pairing (existing flow, restyled)
- App grid (new — the centre of the app)
- Custom app form (new, small)
- Status / activity log (existing log panel, kept)
- Settings, kept minimal in v1: forget this TV (delete the saved
  pairing), check for updates, open the dashboard link in a browser
  as a fallback
- Diagnostics, on the TV setup screen and in Settings: **Check my
  setup**, which tests in order — same network, SSDP reachable,
  TV descriptor, port 36669 reachable, PIN flow — and reports which
  step failed in plain language, instead of a generic error. Plus
  **Export diagnostic log**, with the dashboard key, tokens and PIN
  redacted before the file is written, so a user can paste it into
  an issue. This is the feedback loop that replaces telemetry, and
  it directly addresses the vague-failure reports in the open
  Toshiba and VIDAA 6 issues.

## 3. Architecture — what changes, what does not

### Does not change (shared by all platforms)

- TV protocol, credential derivation, auth profiles, pairing flow,
  token refresh, tile install/launch payloads, session file format.
- The security model: local network only, PIN-gated pairing,
  dashboard key, https-only tile URLs (http only on the LAN), no
  telemetry, no account.
- The CLI (`python sidee.py discover/pair/install/list/launch`) — it
  stays as the power-user and debugging path on desktop, and every
  packaged build must still pass `--self-test`.

### Does change (shared + per-platform)

- **New catalogue layer:** a catalogue module that turns presets +
  user custom apps into one list the dashboard can render, with
  installed-state attached (see §6).
- **New dashboard front end:** `core/dashboard.html` redesigned from
  three fixed cards to a rendered grid. The API stays HTTP + JSON on
  localhost; only the presentation and the catalogue endpoints are new.
- **New desktop launchers, one pattern:** a small Python entry point,
  modelled on `macos_launcher.py`, that starts the dashboard, opens
  it in an embedded view, and stops it on quit. No console window.
  Where possible the desktop launchers share code and differ only in
  the embedded-view backend (see the platform table in §4).
- **New packaging, one per platform:** a Windows PyInstaller spec,
  an updated macOS spec, a Linux PyInstaller spec + AppImage wrapper,
  and an Android project (see §5). CI builds and smoke-tests each
  one (see §7).
- **New dependency, desktop only, one only:** `pywebview` for the
  embedded window on Windows/macOS/Linux. If it proves fragile on
  any desktop OS in testing, that OS falls back to the current
  behaviour — launcher window + system browser — and that decision
  is revisited before release, not after. Android does not use
  pywebview; it uses the platform Android WebView (see §5).
- **Multi-TV design, decided now, shipped later:** the catalogue
  and launch APIs take a TV identifier from Phase 1, even though
  v1 stores a single saved pairing. That way adding saved pairings
  for a second TV later does not break the API or the grid. In v1,
  switching TVs is forget-this-TV plus pair-another, in one flow,
  not a hidden re-PIN ordeal — and the UI must say “one TV in v1”
  plainly, rather than implying multi-TV support it does not have.
- **Native mode, decided now:** native (`native_api.py` /
  `native_session.py`, placeholder service URL) is **excluded from
  the v1 grid** and documented as such. Users must not be able to
  stumble from the grid into a placeholder service. If a real
  native service exists later, native becomes its own later section
  with its own plan — it is not smuggled into v1.
- **Small core changes for portability, done once in Phase 1/2:**
  - `platform_support`: add Linux interface enumeration (parse
    `ip addr` output, with `ifconfig` as fallback) so Linux discovery
    matches Windows/macOS instead of degrading to global broadcast.
  - `platform_support.profile_dir` / dashboard state: keep
    `~/.sidee` on desktop, but allow an explicit state directory
    override for Android's app-private storage (the existing
    `SIDEE_STATE_DIR` mechanism is the model — Android needs a
    code-level equivalent, not an environment variable).
  - Dashboard binding: desktop binds as today; Android binds
    loopback only (127.0.0.1), because the phone is the device
    itself and there is no “open on another phone” step to support.

### Platform table

| Platform | Package | Window | Runtime | Status today |
|---|---|---|---|---|
| Windows 10/11 x64 | Portable folder with `Sidee.exe` inside; single-file exe as optional variant (see §4) | pywebview / WebView2, system-browser fallback | PyInstaller-bundled Python + paho | ZIP + script only |
| macOS 15+ arm64 + x64 | Updated `Sidee.app` (.dmg + .app.zip, as today) | pywebview / WKWebView if it proves clean, else existing Tk control window | PyInstaller-bundled Python + paho | App exists, unsigned, needs grid + repackaging |
| Linux x86_64 | AppImage (portable, no install) | pywebview / WebKitGTK, system-browser fallback | PyInstaller-bundled Python + paho | Unsupported; discovery fix required first |
| Android | APK (sideload from GitHub Releases in v1) | Android WebView loading the localhost dashboard | Python via Chaquopy (see §5) + paho, inside the APK | Nothing; spike gate required |

### Options considered and rejected for v1

| Option | Verdict |
|---|---|
| Rewrite in Electron / Tauri / Flutter with a new frontend | Nicer chrome, but a second (or third) codebase, larger downloads, and a rewrite of the dashboard for no TV-protocol gain. Revisit only if the grid UI outgrows HTML. |
| Full native rewrite per platform (.NET / Swift / Kotlin) | Highest cost and risk: the VIDAA protocol work would have to be re-proven four times. No benefit for v1. |
| Keep the ZIP + `.bat` and just add more presets | Cheapest, but it is not the app the user asked for, and it leaves the first-run download and console window in place. |
| Keep opening the system browser, no embedded window | Acceptable fallback on every platform, but it does not feel like a proper app. Keep as fallback, not as the plan. |
| iOS app in the same release | Out of scope. iOS needs an App Store build, different signing/review rules, and a separate WebView/networking story. It is a later decision, not a v1 promise. |

## 4. Desktop packaging — Windows, macOS, Linux

### Windows (first desktop target)

- PyInstaller **one-directory** build: `Sidee.exe` + an internal
  folder, zipped for download. Double-click the exe, it runs from
  wherever it sits, including a USB stick. State (pairing, custom
  apps) lives in the user profile, as today, so moving the folder
  does not move the TV pairing — that is a feature, not a bug, and
  the docs must say so.
- Bundled inside: Python runtime, `paho-mqtt`, the dashboard, icons,
  the TV client bundle, and the launcher. **No first-run download** —
  this is the main difference from today's Windows ZIP.
- Expected size is in the tens of MB (to be measured in Phase 2),
  not hundreds. If it balloons past that, the build must be trimmed
  (excluded modules, not features) before release.
- **Single-file variant:** PyInstaller `--onefile` produces one
  `.exe` and nothing else, but it extracts to a temp folder on every
  launch (slower start) and is more often flagged by antivirus
  heuristics than a one-directory build. Phase 2 must build both,
  time both, and run both through a basic antivirus/SmartScreen check
  before either is promised. Ship the portable folder first; add the
  single-file variant only if it passes those checks with no worse
  startup.

### macOS (update, not a new build from scratch)

- Keep the existing shape: PyInstaller `Sidee.app`, separate arm64
  and x64 builds, `.dmg` + `.app.zip` as today. The grid dashboard
  is shared, so macOS gets the grid for free once Phase 1 lands;
  only the launcher and the bundle need updating.
- Launcher: try pywebview (WKWebView) first so desktop launchers
  share code; keep the existing Tk control window as the fallback
  if pywebview is not clean on macOS 15. Do not remove a working
  launcher before its replacement is proven on both architectures.
- Minimum stays macOS 15+ in v1. A Universal Binary (one app for
  both architectures) is a later optimisation, not a v1 requirement.

### Linux (new, but the smallest desktop step after Windows)

- **Fix discovery first.** Add Linux interface enumeration to
  `platform_support` (`ip addr` parsing, `ifconfig` fallback),
  with tests using captured command output, exactly as the Windows
  `ipconfig` and macOS `ifconfig` parsers are tested today. Until
  this lands, a Linux build would ship with degraded discovery and
  should not be released.
- **Package as an AppImage** for x86_64: one file, no install, no
  root, runs from any folder — the closest Linux equivalent to the
  Windows portable folder. PyInstaller produces the binary inside
  the AppImage; the AppImage wrapper is thin.
- WebView backend is WebKitGTK via pywebview, which is not
  guaranteed present on every distro — system-browser fallback is
  therefore mandatory on Linux, not optional, and must be tested by
  forcing the fallback path.
- `.deb` / `.rpm` / Flatpak are later distribution options, not v1.
  Do not promise a distro package until the AppImage is proven.
- Test distros in v1: Ubuntu LTS (primary) plus one Fedora check if
  time allows. “Linux” without a named distro is not a test plan.

## 5. Android — the APK, and why it gets a spike gate

### What the APK must do

A standalone phone app: open it, find the TV on the same Wi-Fi,
enter the PIN, see the same app grid, install a tile — with **no PC
involved at all**. That is different from today's phone QR code,
which only opens a PC's dashboard in a phone browser. If the APK
still needed a PC, it would not be worth building.

### Recommended approach: Chaquopy + Android WebView + existing Python core

- **Android project (Kotlin + Gradle):** one Activity that hosts
  an Android WebView, plus the Python core running inside the app
  via **Chaquopy** (a Gradle plugin that embeds Python in an Android
  app and can install pip packages).
- **Inside the APK, the architecture mirrors desktop:** the Python
  core starts the same dashboard server on localhost (loopback
  only), the Android WebView loads it with its key, and the grid,
  pairing and install flows are the same code as desktop. No
  protocol rewrite, no second dashboard.
- **Why this is plausible:** `paho-mqtt` is pure Python, the core
  has no desktop-only dependencies except the launcher (which
  Android replaces with an Activity), and the dashboard is already
  HTML/JS. The TV client certificate bundle and session file live
  in the app's private storage, not in a user home directory.
- **Android-specific work that is real and must be planned for:**
  - Permissions: `INTERNET`, `ACCESS_WIFI_STATE`,
    `ACCESS_NETWORK_STATE`, and `CHANGE_WIFI_MULTICAST_STATE` with
    a Wi-Fi multicast lock, without which SSDP discovery will not
    hear the TV on many phones. Requested at runtime where Android
    requires it, with a plain-language explanation in the app.
  - Network on Android is not desktop networking: the phone may
    prefer mobile data, a VPN, or a different Wi-Fi band. The app
    must check it is on Wi-Fi, warn if it is not on the same
    network as the TV, and never silently use mobile data for
    discovery.
  - The app must stay in the foreground while pairing/installing
    (a pairing that dies when the phone sleeps is a broken pairing).
    Foreground handling, not a background service, in v1.
  - WebView security: the WebView loads **only** the localhost
    dashboard. Tile URLs are sent to the TV; they are not opened
    in the phone's WebView, and the WebView must not be a general
    browser for arbitrary URLs.
  - APK size will be larger than a native app (Python runtime +
    Chaquopy + paho + dashboard) — measure it in the spike, do not
    promise a size now.
  - Distribution in v1 is **sideload from GitHub Releases**
    (download the APK, allow “install unknown apps” for that source).
    Google Play is later: it needs a Play signing key, a privacy
    policy, store listing, and review — a separate phase, not a v1
    blocker, and the APK must be built so it can be Play-signed
    later without changing the app.

### The spike gate (do this before committing to Android)

Build a minimal spike APK that proves, on a real phone and on an
emulator, each of these — and stop if any fails:

1. Chaquopy runs `core/client.py` + `paho-mqtt` and the dashboard
   server starts on localhost inside the app.
2. SSDP discovery finds a TV (or, without a TV, a simulated TV on
   the LAN using the existing test doubles) with a multicast lock.
3. An MQTT/TLS connection using the bundled client certificate
   reaches the TV broker (or the simulated TV) and a PIN flow can
   start.
4. The Android WebView loads the localhost dashboard and the grid
   renders, and a session survives an app restart in private storage.
5. APK builds in CI (Android SDK + Chaquopy + Gradle) without a
   developer's local machine being a special snowflake.

**If the spike fails, the fallbacks, in order, are:**

1. Defer Android and ship desktop first — the grid and exe work is
   not wasted, because Android would have reused it.
2. A native Kotlin port of the protocol (MQTT client, SSDP, MD5
   credential derivation, cert handling) with a native Android UI —
   a genuinely larger project, to be re-planned and re-estimated,
   not smuggled into v1.
3. Do **not** ship an Android app that is only a WebView wrapper
   around a PC dashboard and call it an APK — that already exists
   as the phone QR code, and it does not meet the goal in this plan.

## 6. The app grid and catalogue

### Catalogue data model (new, one JSON-like record per app)

```text
id            e.g. "nuvio" — stable, lowercase, used as the tile app_id base
name          e.g. "Nuvio"
description   one line, shown on the card
category      e.g. "Media" / "Music" / "Tools" / "Custom"
icon          local asset if available, otherwise an https icon URL
url           fixed https URL, or a template needing a server address
server        none | required | optional, with a placeholder + help text
needs         e.g. "Internet", "Your own server", "Stremio server (optional)"
source        "built-in" | "custom" — custom apps are user data, never shipped
```

Rules carried over from today, not relaxed for the grid:

- Tile URLs must be https, except http to a private-LAN host.
- App IDs match `[a-z0-9_]{1,32}`; names match the existing
  `[\w \-']{1,40}` rule. The custom-app form enforces the same rules
  server-side in `webui._validate_preset`, not just in the browser.
- Custom apps are stored in the user's profile (desktop) or the
  app's private storage (Android), never written into the shipped
  catalogue, and never uploaded anywhere.

### Installed state — the part that makes a grid trustworthy

Today the dashboard cannot tell the user what is already on the TV.
The grid must, so each card can show Install / Installed / Open:

- New API: `GET /api/catalog` returns the catalogue with, per app,
  `installed: true/false` and the TV-reported URL, computed from one
  fresh app-list request (the same request `list_tiles` already makes).
- New API: `POST /api/launch` for opening an installed tile from the
  grid, reusing `client.launch_tile` and the same server-URL rules as
  install (this also fixes the CLI gap in spirit: Jellyfin launch
  without a server must be refused, not sent blank).
- Install confirmation keeps the current rule, including the
  normalisation added in commit `8058bab`: host case, trailing slash
  and default ports do not count as a mismatch, but genuinely
  different addresses still do not confirm.
- If the TV does not answer the app list, the grid shows “unknown”
  rather than guessing, and Install remains available.

### Catalogue updates without rebuilding the app

The bundled catalogue is the fallback, not the only catalogue.
The app may fetch an updated catalogue file over HTTPS (from the
fork's Releases, same origin as the update check), validate it as
**data only** — schema, app-ID and name rules, https URLs (http
only on the LAN), icon URLs — and use it only if it validates.
If the fetch fails or validation fails, the app keeps the bundled
catalogue and says so; it never blocks the grid on a catalogue
fetch, and it never executes anything from a catalogue file.
Effect: adding a vetted app becomes a data release, not a rebuild
of four platform packages. The catalogue file itself is versioned
and checksummed, and the release process (§7) covers it.

### Installed state — performance and queuing

- The grid renders instantly from the **last known** installed
  state (cached with the pairing), then refreshes it in the
  background from one fresh app-list request. It shows when that
  state was last refreshed and offers a refresh button. If the TV
  does not answer, the state becomes “unknown” — it never guesses
  and never blocks the grid on a slow TV.
- Installs queue per card with progress, serialised by the existing
  operation lock. The user can queue several installs; the app does
  not let them hammer Install while an install is in flight, and
  each card's progress is shown separately.

### Which apps are in the grid at launch?

- **v1 ships with the existing three** (Nuvio, Stremio, Jellyfin)
  plus the Custom app card. That is deliberate: the grid, the
  installed-state logic and the packages are the v1 deliverable,
  not a long unverified app list.
- **Expansion is a vetting pipeline, not a brainstorm.** Before any
  new built-in app is added, it must pass: (a) an https web client
  that works on a VIDAA TV browser, (b) D-pad/remote navigation
  without a mouse, (c) a stable URL and icon that Sidee does not
  control but can link to, (d) no login or payment flow that Sidee
  would be implying support for. Each addition gets its own test
  (preset validation + dashboard rendering) and a docs note.
- **Categories are fixed in v1** (Media, Music, Tools, Custom) and
  only grow when there are at least two vetted apps in a new one —
  no single-app categories.
- Icons: prefer local assets bundled in every package (no dependency
  on a third party staying up). Remote icons are allowed only over
  https and only as a fallback, and a missing icon must never break
  a card.

## 7. Signing, updates, distribution, and CI

### Signing — the one item that costs money and cannot be faked

- **Windows:** an unsigned exe triggers SmartScreen warnings.
  Options: ship unsigned for early testing with docs explaining the
  click-through (acceptable for a beta, not for a general release),
  or buy an OV/EV code-signing certificate and sign in CI (budget
  decision + certificate holder — a user decision, see §10).
- **macOS:** the app is already unsigned/notarized. Proper release
  needs an Apple Developer Program membership and notarization in
  CI — a separate cost decision from Windows signing, with the same
  “unsigned for beta, signed for release” staging.
- **Linux AppImage:** no central signing gate in v1; checksums on
  the release page are the integrity mechanism.
- **Android APK:** sideloaded APKs trigger Android's “unknown
  apps” prompt in v1 — expected, documented, and not a defect.
  Play signing is a later phase (see §5).

### Updates — manual in v1, per platform

- The app checks a version file on GitHub Releases and tells the
  user a new version exists, with a download link. It never downloads
  or installs an update silently. Auto-update is a later phase on
  every platform, once signing exists, because an unsigned
  auto-updater is worse than a manual one.
- On Android, “update” in v1 means downloading the new APK from
  Releases and installing it over the old one (same signing key,
  so data including the pairing survives). Play-based updates come
  with Play distribution, later.

### Distribution and CI

- **Distribution:** GitHub Releases on the fork, one release with
  all platform assets + SHA-256 checksums — not CI artifacts that
  expire after 30 days. Assets in v1:
  `Sidee-Windows.zip` (portable folder with `Sidee.exe`),
  `Sidee-macOS-arm64.dmg` + `.app.zip`,
  `Sidee-macOS-x64.dmg` + `.app.zip`,
  `Sidee-Linux-x86_64.AppImage`,
  `Sidee-Android.apk`.
- **CI matrix (same version, same tag, all platforms):**
  Windows (PyInstaller exe + smoke test), macOS arm64 + x64
  (existing jobs, updated), Linux x86_64 (PyInstaller + AppImage +
  smoke test), Android (Gradle + Chaquopy APK build + unit tests;
  device testing is manual, not CI, in v1).
- **Release guard:** `tools/public_release_guard.py` already
  allowlists what may ship — every new spec, launcher, catalogue
  file and dependency must be added to that allowlist explicitly.
  The guard must be extended, not bypassed, for any platform.
- **Versioning:** keep the existing `X.Y.Z.N` scheme, one version
  across all platforms. The next release after this work is a minor
  bump with a proper changelog (`docs/releases/`), not a silent
  rebuild of 0.1.4.2.
- **Version mapping (one version, four formats):** the release
  version maps explicitly, in the build scripts, to Android
  `versionCode` (monotonically increasing integer) + `versionName`,
  macOS `CFBundleShortVersionString` (three parts) +
  `CFBundleVersion` (build number, already in `packaging/macos.spec`)
  + the full `SideeReleaseVersion` key, and Windows file/product
  version. The mapping is tested in CI so a release cannot ship
  with four different numbers by accident.
- **Beta channel:** GitHub pre-releases are the beta channel.
  Beta builds are marked as such in the app, update checks offer
  them only to users who opted into beta, and the issue template
  for beta reports asks for TV model, firmware, and the redacted
  diagnostic log. Public release follows only after a beta soak,
  not directly from CI artifacts.
- **Trademark and icon check:** before any public release, check
  the built-in names and icons (Nuvio, Stremio, Jellyfin) against
  their projects' trademark/logo policies, and record the outcome.
  This matters more once the app is signed and distributed widely
  than it did as a small open-source tool, and it must happen
  before Phase 5, not after.

## 8. Security and privacy — what must not regress

- Local only: discovery, pairing and control stay on the LAN.
  The packages must not add any cloud account, analytics, or
  phone-home. The version check in §7 is the only outbound request
  the app itself makes, it sends no TV or user data, and it is
  opt-out-able by simply not clicking it.
- The dashboard key, PIN handling, session file permissions, and
  the “keep links private” warnings all carry over unchanged. On
  Android, the session lives in app-private storage, which is the
  Android equivalent of the desktop profile permissions.
- MQTT to the TV still uses the TV's client certificate with
  verification off (a known, documented tradeoff for TV brokers) —
  this plan does not change that, and the README should say so
  plainly rather than leaving it implicit.
- Custom apps are a trust boundary: a user who adds a custom URL is
  choosing to open that site on their TV. The form must say that in
  plain language, and custom apps must never be silently promoted
  into the built-in catalogue.
- On Android, the WebView must load only the localhost dashboard
  (see §5). A WebView that can browse arbitrary URLs is not part
  of this plan.

## 9. Phases, deliverables, and how each one is proven

### Phase 0 — Decisions and catalogue seed (small)

- Answer the §10 decisions. Freeze the v1 app list (the existing
  three + Custom) and the package order (Windows → macOS → Linux →
  Android spike).
- Deliverable: this plan, approved, with decisions recorded.
- Done when: no open decision blocks Phase 1.

### Phase 1 — Catalogue + grid dashboard (shared, benefits all platforms)

- New catalogue logic (new `core/catalog.py`, or inside
  `presets.py` if it stays small — decide while building, do not
  split prematurely): built-in presets + user custom apps → one
  catalogue, with validation reused from `webui._validate_preset`.
- New APIs: `GET /api/catalog` (with installed state),
  `POST /api/launch`, `POST /api/custom` (add), `DELETE /api/custom`
  (remove a custom app — built-ins cannot be deleted).
- Dashboard rewrite: grid rendering, search, category filter,
  per-card Install/Installed/Open, inline server field, custom-app
  form, “unknown” installed state when the TV does not answer.
  Grid rendering uses the cached-installed-state + background
  refresh model in §6, and installs queue per card with progress.
- Dashboard strings externalised at rewrite time (even if only
  English ships in v1), so translation later is data work, not a
  rewrite. Keyboard navigation, focus states and screen-reader
  labels on grid cards are Phase 1 acceptance criteria, not
  Phase 4 polish — the grid is new UI, and accessibility deferred
  to polish is accessibility never done.
- Custom apps stored in the user profile, loaded on startup,
  validated on load (a corrupt custom entry must not break the grid).
- **Migration:** existing `~/.sidee/session.json` pairings import
  unchanged, and existing `presets_local.py` custom apps import
  into the new custom-app storage, with a migration test covering
  both. Existing users must not be forced to re-PIN by the upgrade.
- **Diagnostics:** the “Check my setup” step and redacted log
  export from §2 land here, reusing the existing probe/discovery
  code, not as a separate later feature.
- Linux discovery fix (`platform_support` + tests) lands here or
  at the start of Phase 2 at the latest — it must land before any
  Linux release, and doing it early de-risks Linux.
- Tests: catalogue validation, installed-state mapping, launch
  server rules, dashboard JS interaction tests (extend the existing
  Node test file), plus the existing Python suite staying green.
- Done when: `python sidee.py` shows the grid, installs the three
  presets, shows Installed after a simulated TV app list, launches
  from the grid, and adds/removes a custom app — all without a TV,
  via the simulated-TV tests, plus a manual TV check if a TV is
  available.

### Phase 2 — Desktop packages: Windows, then macOS, then Linux

- **Windows:** `packaging/windows.spec` (PyInstaller, windowed, no
  console), `windows_launcher.py` (control window + pywebview
  embedded dashboard, system-browser fallback),
  `tools/build_windows_exe.py` (build + verify bundled resources +
  guard check). CI job builds the exe, runs `--self-test` on it,
  runs the headless dashboard smoke test against it.
- **macOS:** update `packaging/macos.spec` + `macos_launcher.py`
  for the grid (pywebview attempt with Tk fallback), rebuild both
  architectures, verify as the existing macOS job does. The existing
  source-ZIP job stays until the exe replaces it — do not delete
  the working distribution before its replacement is proven.
- **Linux:** `packaging/linux.spec` + AppImage wrapper +
  `tools/build_linux_appimage.py`, CI job on Ubuntu, smoke test
  against the AppImage, forced-fallback test for the WebView.
- Measure per platform: cold-start time, package size, and (for
  Windows) one-file vs one-directory comparison and
  SmartScreen/antivirus behaviour on a fresh machine or VM.
- Done when: a tester with no Python installed can, on each
  desktop OS, download the artifact, open the app, pair a TV (or
  reach the pairing screen cleanly without one), and see the grid.

### Phase 3 — Android spike, then APK (gated)

- **Spike first (small, time-boxed):** the five proofs in §5,
  on a real phone and an emulator, with a simulated TV if no real
  TV is available. Report: APK size, startup time, discovery
  result, and whether Chaquopy + paho + multicast + WebView all
  work together. This report is a go / no-go decision point.
- **If go:** full Android project — Activity + WebView + Chaquopy
  core + private storage + permissions + foreground handling +
  sideload install docs + CI APK build. The grid and catalogue
  come from Phase 1 unchanged; only the wrapper is new.
- **If no-go:** Android is deferred (see §5 fallbacks) and the
  project proceeds to Phase 4 with desktop only. The spike code
  is kept in a branch, not deleted, so a later retry does not
  start from zero.
- Done when: a tester can install the APK on a phone, pair a TV
  from the phone alone, install a tile from the grid, close and
  reopen the app, and still be paired.

### Phase 4 — Polish and hardening, cross-platform

- Forget-this-TV, update check (§7), better error messages for the
  common failures (TV not found, PIN expired, install unconfirmed —
  with the “check Home on your TV” guidance, not a raw error),
  accessibility pass on the grid (keyboard navigation, focus states,
  reduced-motion respect already in the dashboard JS).
- Icon bundling: local icons for all built-ins; remote-icon fallback
  that cannot break a card.
- Docs: rewrite the README per platform (one section each, with
  the exact download name per OS), keep the source-checkout section
  for developers, add a “portable mode” note, SmartScreen and
  sideload notes, and a Linux distro note. Docs must also state,
  plainly: one TV in v1, native excluded from the v1 grid, and
  that the grid is a catalogue of tiles, not a guarantee that any
  web app runs well on any TV.
- Trademark/icon check (§7) and beta-channel setup (§7) land here,
  before Phase 5 — not after release.
- Done when: the README matches the shipped artifacts exactly, and
  every error path a user can hit in the grid has a plain-language
  message on every platform.

### Phase 5 — Cross-platform release

- Version bump + changelog, GitHub Release with all platform
  assets + SHA-256 checksums, release-guard pass, full test suite +
  smoke test on the release artifacts themselves (not just on
  source).
- Announcement wording that does not over-claim: supported
  firmware, unsigned/SmartScreen/sideload status if applicable, and
  that tiles, not the TV OS, are what Sidee changes.
- Done when: the release page, not an Actions artifact, is the
  download link in the README for every platform.

### Later, explicitly not v1

- Google Play distribution, Flatpak / `.deb` / `.rpm`, auto-update
  on any platform, iOS, ARM64 Linux, multi-TV management, a phone
  app beyond the APK, and any native-install service work (the
  placeholder service URL in `native_api.py` is untouched by this
  plan).

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| PyInstaller one-file flagged by antivirus / SmartScreen blocks users | Ship one-directory first; test both variants; signing decision below; never ask users to disable security software. |
| pywebview / WebView2 / WebKitGTK missing or broken on some machines | System-browser fallback built in from the start, tested by forcing the fallback path on every desktop OS. |
| Chaquopy spike fails on Android | Spike gate in Phase 3: defer Android rather than forcing a native rewrite into v1; keep spike code in a branch. |
| Android multicast / Wi-Fi behaviour varies by phone | Multicast lock + Wi-Fi check + plain-language “same network” warning; test on a real phone, not only an emulator. |
| A new grid app's URL or icon changes or disappears | Local icons where possible; catalogue entries carry no promise beyond “this URL worked when vetted”; unvetted apps stay in Custom, not built-in. |
| TV app-list format varies by firmware, so Installed state is wrong | “Unknown” state instead of guessing; confirmation rule unchanged; manual TV test matrix (U09.60 first, then the firmwares in the compatibility docs). |
| Remote catalogue tampered with or malformed | Data-only validation (§6) + bundled fallback + version/checksum; a bad catalogue never blocks the grid and never executes code. |
| Existing users lose a pairing or custom app on upgrade | Migration test in Phase 1 (§9); upgrade must import session + `presets_local.py`, never silently discard them. |
| Linux distro fragmentation | AppImage + named test distros (Ubuntu LTS primary); no distro-package promises in v1. |
| Scope creep: the grid becomes an app store | Fixed v1 list + vetting pipeline (§6); every new app is a separate, reviewed change. |
| Fork drift from upstream | Keep the protocol/core changes minimal and well-tested so upstream fixes can still be merged; record any deliberate divergence in the README. |

## 11. Decisions needed from you before building

1. **Order confirmed?** Windows → macOS → Linux → Android spike.
   Recommended: yes, as in §9. Any reordering changes what is
   testable first.
2. **Android approach:** Chaquopy spike first (recommended), or go
   straight to a native Kotlin port? The spike is cheaper and
   reuses the core; the Kotlin port is a bigger, separate project.
3. **Android distribution in v1:** sideload from GitHub Releases
   (recommended), or start the Google Play process now? Play is
   later work, not a v1 blocker, but starting it early changes
   signing and listing work.
4. **Linux package:** AppImage first (recommended), or do you want
   Flatpak / `.deb` in v1 as well?
5. **Desktop window:** embedded pywebview with system-browser
   fallback (recommended) on all three desktop OSes, or keep the
   existing Tk launcher on macOS and only use pywebview on
   Windows/Linux?
6. **Signing:** ship unsigned for beta on Windows and macOS, or buy
   certificates (Windows code-signing, Apple Developer Program)
   before any public release? These are two separate costs.
7. **Windows exe variant:** portable folder first, single-file
   only if it passes Phase 2 checks (recommended) — or single-file
   at all costs?
8. **First grid beyond the existing three:** start with three +
   Custom only, or do you have specific apps you want vetted for
   v1? Name them and they go through the §6 checklist — no app is
   added on a name alone.
9. **Branding/distribution on the fork:** keep the Sidee name and
   Ko-fi link, or rebrand the fork's releases? README and the
   Jellyfin icon URL still point at upstream today and need
   repointing either way for a fork release.
10. **Updates:** manual update check in v1 (recommended), or defer
    even that and ship with no update mechanism at all?
11. **Remote catalogue:** fetch updated catalogues as data (§6,
    recommended), or ship only the bundled catalogue and require a
    new app release for every new app?
12. **Multi-TV in v1:** one saved pairing + forget-and-pair-another
    (recommended, with the API designed for multi-TV later), or
    delay Phase 1 until multi-TV saved pairings are built?
13. **Native mode:** exclude from the v1 grid and document it
    (recommended), or keep it reachable in v1 in some form?
14. **Beta channel:** GitHub pre-releases before public release
    (recommended), or go straight from CI artifacts to a public
    release?

## 12. What this plan deliberately does not promise

- No new TV protocol work, no new firmware support claims, no
  native-install service (that URL is still a placeholder), no
  auto-update, no Play Store release, no iOS app, no multi-TV saved
  pairings in v1 (one TV + forget-and-pair-another), no ratings,
  no app-store review process, no phone-home analytics, and no
  guarantee that any particular third-party web app will work on
  any particular TV.
  The grid is a catalogue of tiles Sidee can install; whether a
  web app itself runs well on a given TV is that app's behaviour,
  and the plan says so in the UI copy as well as here.

---

*Next step if approved: Phase 0 decisions (§11), then Phase 1
catalogue + grid. No code changes are included in this plan.*
