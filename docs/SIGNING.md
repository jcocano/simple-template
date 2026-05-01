# Code Signing — Operational Runbook

This runbook walks through getting Simple Template signed and notarized for macOS and signed for Windows. It is a one-time setup; once the GitHub Secrets below are configured, every tagged release will produce signed installers automatically.

The plan is **Apple Developer Program** for macOS and **SignPath Foundation** (free for OSS) for Windows. Linux artifacts are never signed.

The repository is already wired so that signing activates automatically when the secrets are present. While the secrets are missing, the unsigned build path keeps working unchanged.

---

## 1. macOS — Apple Developer Program

### 1.1 Enroll

1. Go to <https://developer.apple.com/programs/enroll/> and sign in with the Apple ID you want to use as the publishing identity (it can be your personal Apple ID).
2. Choose **Individual / Sole Proprietor** (USD $99 / year). Enrollment usually completes within minutes once the payment clears, occasionally up to 48 hours if Apple requests verification.
3. After approval, accept the Apple Developer Program License Agreement at <https://developer.apple.com/account/>.

### 1.2 Create the Developer ID Application certificate

The certificate that signs the app outside the Mac App Store is **Developer ID Application** (not "Mac Developer" or "Apple Distribution").

1. Open **Keychain Access** on your Mac.
2. Menu: **Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority…**
   - User Email Address: `jesus.cocano@gmail.com`
   - Common Name: `Jesus Cocaño`
   - CA Email: leave empty
   - Request is: **Saved to disk**
   - Click Continue and save the `.certSigningRequest` (CSR) file.
3. Go to <https://developer.apple.com/account/resources/certificates/list>.
4. Click **+** → select **Developer ID Application** → Continue.
5. Upload the CSR you just saved → Continue → **Download** the resulting `.cer`.
6. Double-click the `.cer` to install it into your login keychain. It should land paired with the private key Keychain generated for the CSR.

### 1.3 Export the certificate as a `.p12`

This is the file CI uses to sign.

1. In Keychain Access, **My Certificates** → find **Developer ID Application: Jesus Cocaño (TEAMID)**.
2. Right-click → **Export…** → save as `developer-id.p12`.
3. Set a strong password — you will store this password in GitHub Secrets too.

### 1.4 Find your Team ID

1. <https://developer.apple.com/account> → in the top-right click your name → **Membership details** → copy the **Team ID** (10-character alphanumeric, e.g. `ABCDE12345`).

### 1.5 Generate an app-specific password for notarization

Notarization requires Apple ID + Team ID + an **app-specific password** (not your real Apple ID password).

1. Go to <https://account.apple.com/account/manage> → sign in with the same Apple ID enrolled in the Developer Program.
2. **App-Specific Passwords** → **Generate Password** → label it `Simple Template notarization`.
3. Copy the 19-character password (format `xxxx-xxxx-xxxx-xxxx`). You will not be able to view it again.

### 1.6 Configure GitHub Secrets

In GitHub: **Repo → Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Value |
|---|---|
| `MAC_CSC_LINK` | base64 of the `.p12` file. Generate locally: `base64 -i developer-id.p12 \| pbcopy` (macOS) and paste. |
| `MAC_CSC_KEY_PASSWORD` | The password you set when exporting the `.p12`. |
| `APPLE_ID` | The Apple ID enrolled in the Developer Program (`jesus.cocano@gmail.com`). |
| `APPLE_APP_SPECIFIC_PASSWORD` | The 19-character app-specific password from step 1.5. |
| `APPLE_TEAM_ID` | The 10-character Team ID from step 1.4. |

That's everything for macOS. The next tagged release will sign the `.app`, sign the `.dmg`/`.zip`, and notarize via Apple's notary service automatically.

### 1.7 Verify a signed build (optional)

After the next release runs, on a Mac:

```sh
codesign --verify --deep --strict --verbose=2 "/Applications/Simple Template.app"
spctl --assess --verbose=2 "/Applications/Simple Template.app"
```

`spctl` should report `accepted source=Notarized Developer ID`. Gatekeeper will let the app open without warnings on first launch.

---

## 2. Windows — SignPath Foundation

SignPath Foundation provides free EV-equivalent code signing for open-source projects. They sign on their own infrastructure (no USB token, no HSM to manage), and the resulting binaries get immediate SmartScreen reputation.

### 2.1 Apply

1. Go to <https://signpath.org/foundation> → **Apply for free signing**.
2. Fill the application:
   - Project: Simple Template
   - Repository: <https://github.com/jcocano/simple-template>
   - License: MIT
   - Description: pull from the README
   - Maintainer: Jesus Cocaño / `jesus.cocano@gmail.com`
3. Submit. Approval is manual and takes anywhere from a few days to a few weeks. They sometimes ask follow-up questions over email.

### 2.2 After approval — configure the SignPath project

Once approved, log into <https://app.signpath.io/>. You will be the **Submitter** of a project that lives under the `SignPath Foundation` organization.

1. **Project → Artifact Configurations** → create one for the NSIS installer.
   - Type: **Windows NSIS installer**
   - Configure SignPath to sign both the outer `.exe` installer **and** the inner `Simple Template.exe` (NSIS embeds the app exe; both must be signed for SmartScreen to recognize the app once installed).
2. **Project → Signing Policies** → create a `release-signing` policy that uses the OSS code signing certificate.
3. **Project → CI Integrations → GitHub Actions** → SignPath generates the values you need for the GitHub Secrets below.

### 2.3 Configure GitHub Secrets

| Secret | Value |
|---|---|
| `SIGNPATH_API_TOKEN` | Personal API token from SignPath (User → API Tokens → Create). Treat it like a password. |
| `SIGNPATH_ORG_ID` | Organization ID shown in SignPath (UUID). |
| `SIGNPATH_PROJECT_SLUG` | Project slug — usually `simple-template`. |
| `SIGNPATH_SIGNING_POLICY_SLUG` | The slug of the policy created in 2.2 — e.g. `release-signing`. |
| `SIGNPATH_ARTIFACT_CONFIG_SLUG` | The artifact-configuration slug from 2.2. |

### 2.4 First signed Windows release

Once the secrets are in place:

1. Tag a new version: `git tag v0.0.2 && git push origin v0.0.2`.
2. The release workflow will:
   - Build the unsigned `.exe` on the Windows runner.
   - Upload it to SignPath via the official action.
   - Wait for SignPath to sign it (and request approval if your policy is set to "release" mode).
   - Download the signed `.exe` back into `release/`.
   - Attach the signed installer to the draft GitHub Release.

If your release policy requires manual approval inside SignPath, the workflow waits up to its `wait-for-completion` timeout. Approve the request in the SignPath UI and the workflow continues.

### 2.5 Verify a signed build (optional)

On a Windows machine, right-click the installer → **Properties → Digital Signatures**. The signature should be present and verify successfully. SmartScreen should not warn on first launch.

---

## 3. Operational notes

- **Cost**: Apple Developer Program is USD $99 / year, due on enrollment anniversary. SignPath Foundation is free.
- **Renewal**: Apple charges automatically; certificates inside the program last one year and need to be re-issued from the developer portal annually (re-export the `.p12`, update `MAC_CSC_LINK` and `MAC_CSC_KEY_PASSWORD`). SignPath issues certs for the duration of project enrollment.
- **Identity rotation**: if the Apple ID changes, revoke the old cert in the developer portal first, then re-issue. Update the GitHub secrets after each rotation.
- **Backwards compatibility**: until both platforms are configured, the `Heads up — unsigned binaries` block in the README stays accurate. After the first signed release, update those warnings to the per-platform state (macOS signed but Windows not yet, etc.).
- **Local builds**: `npm run dist` on a developer machine still produces unsigned artifacts unless you set `CSC_LINK` / `CSC_KEY_PASSWORD` in your shell. Don't commit your `.p12`.

---

## 4. Tracking

- [ ] Apple Developer Program enrollment paid
- [ ] Developer ID Application cert downloaded + installed in Keychain
- [ ] `developer-id.p12` exported
- [ ] Apple Team ID captured
- [ ] App-specific password generated
- [ ] All five `MAC_*` / `APPLE_*` GitHub Secrets configured
- [ ] First signed-and-notarized macOS release verified with `spctl --assess`
- [ ] SignPath Foundation application submitted
- [ ] SignPath approval received
- [ ] SignPath project, artifact configuration, and signing policy created
- [ ] All five `SIGNPATH_*` GitHub Secrets configured
- [ ] First signed Windows release verified via Windows Properties → Digital Signatures
- [ ] Update `README.md` (and localized READMEs) to remove or downscope the unsigned-binaries warning
