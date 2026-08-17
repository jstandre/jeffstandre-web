# Mac Audit (audit_mac.py)

A lightweight, zero-dependency Python script to audit baseline macOS security settings on Apple Silicon (M-series) Macs.

## Features

Audits key macOS security protections in under two seconds:

1. **FileVault Disk Encryption**: Verifies whole-disk encryption is active.
2. **Application Firewall**: Checks global firewall state.
3. **Firewall Stealth Mode**: Verifies ICMP ping and port scan suppression.
4. **Gatekeeper Verification**: Ensures only signed and verified applications run.
5. **System Integrity Protection (SIP)**: Confirms core operating system file protection is active.
6. **Automatic Software Updates**: Verifies security patch checking is enabled.
7. **Remote Login (SSH)**: Ensures remote command line access is disabled when not needed.

## Prerequisites

* macOS running on Apple Silicon (M1/M2/M3/M4) or Intel.
* Python 3 (pre-installed on macOS).

## Quick Start

1. Download or clone this repository:

```bash
git clone https://github.com/jstandre/audit_mac.git
cd audit_mac
```

2. Run the audit script:

```bash
python3 audit_mac.py
```

3. View results:

The script prints the audit results to your terminal window and automatically saves a detailed text summary report to `mac_security_report.txt`.

## Sample Output

```text
==================================================
MACOS BASELINE SECURITY AUDIT REPORT
Timestamp: 2026-08-17 08:14:00
Hardware Architecture: arm64
==================================================

[PASS] Chip Architecture: Apple Silicon (M1/M2/M3) detected.
[PASS] FileVault Disk Encryption: ENABLED
[PASS] Application Firewall: ENABLED
[PASS] Firewall Stealth Mode: ENABLED
[PASS] Gatekeeper App Verification: ENABLED
[PASS] System Integrity Protection (SIP): ENABLED
[PASS] Automatic Software Update Checking: ENABLED
[PASS] Remote Login (SSH): DISABLED

==================================================
END OF AUDIT REPORT
==================================================

Report saved successfully to mac_security_report.txt
```

## License

MIT License. Free to use, modify, and distribute.
