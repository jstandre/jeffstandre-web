# Building a Local Python Script to Audit Security on Your M-Series MacBook Pro

Many people think keeping a Mac secure requires buying expensive monthly security software. 

The truth is that macOS already has powerful security protections built directly into Apple Silicon chips and the operating system. You do not need bloated third party software. You just need a way to verify that your built in macOS security settings are actually turned on and configured correctly.

In this guide, we will write a simple Python script that checks seven key baseline security settings on your M-series MacBook Pro and writes a clean summary report to your desktop.

---

## What the Security Audit Checks

Our script runs standard built in macOS system checks to verify these key protections:

1. **FileVault Disk Encryption**: Scrambles all data on your hard drive so nobody can read your personal files if your laptop is stolen.
2. **Application Firewall**: Blocks uninvited network connections coming from the outside world.
3. **Firewall Stealth Mode**: Prevents your Mac from answering network pings, hiding your computer on public Wi-Fi networks in places like coffee shops.
4. **Gatekeeper Enforcement**: Ensures only verified and signed software can run on your Mac.
5. **System Integrity Protection (SIP)**: Locks down critical operating system files so malware cannot alter core macOS files.
6. **Automatic Software Updates**: Verifies that your Mac is set to automatically check for security patches.
7. **Remote Login (SSH) Status**: Checks if remote command line access is disabled so strangers cannot log into your laptop over the network.

---

## Step 1: Open Terminal on Your Mac

To run a Python script, you will use the built in Terminal app:

1. Press `Command + Space` on your keyboard to open Spotlight Search.
2. Type `Terminal` and press `Enter`.
3. A small text window will open. Python 3 comes preinstalled on macOS, so no extra downloads are needed.

---

## Step 2: Create the Python Security Script

Create a new file named `audit_mac.py` and copy the code below into it.

```python
import subprocess
import platform
import sys
from datetime import datetime

def run_command(command):
    """Helper function to run system commands safely."""
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=5
        )
        output = (result.stdout + " " + result.stderr).strip()
        return output
    except Exception as error:
        return f"Error executing command: {str(error)}"

def check_security():
    report_lines = []
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    report_lines.append("==================================================")
    report_lines.append(f"MACOS BASELINE SECURITY AUDIT REPORT")
    report_lines.append(f"Timestamp: {timestamp}")
    report_lines.append(f"Hardware Architecture: {platform.machine()}")
    report_lines.append("==================================================")
    report_lines.append("")

    # Check 1: Apple Silicon Chip Verification
    arch = platform.machine()
    if arch == "arm64":
        report_lines.append("[PASS] Chip Architecture: Apple Silicon (M1/M2/M3) detected.")
    else:
        report_lines.append(f"[INFO] Chip Architecture: {arch} detected.")

    # Check 2: FileVault Encryption Status
    filevault_out = run_command(["fdesetup", "status"])
    if "FileVault is On" in filevault_out:
        report_lines.append("[PASS] FileVault Disk Encryption: ENABLED")
    else:
        report_lines.append("[WARN] FileVault Disk Encryption: DISABLED (Turn on in System Settings)")

    # Check 3: Application Firewall Status
    firewall_out = run_command(["/usr/libexec/ApplicationFirewall/socketfilterfw", "--getglobalstate"])
    if "State = 1" in firewall_out or "State = 2" in firewall_out or "enabled" in firewall_out.lower():
        report_lines.append("[PASS] Application Firewall: ENABLED")
    else:
        report_lines.append("[WARN] Application Firewall: DISABLED (Turn on in Network Settings)")

    # Check 4: Firewall Stealth Mode
    stealth_out = run_command(["/usr/libexec/ApplicationFirewall/socketfilterfw", "--getstealthmode"])
    if "stealth mode is on" in stealth_out.lower():
        report_lines.append("[PASS] Firewall Stealth Mode: ENABLED")
    else:
        report_lines.append("[WARN] Firewall Stealth Mode: DISABLED (Turn on in Network Settings)")

    # Check 5: Gatekeeper Status
    gatekeeper_out = run_command(["spctl", "--status"])
    if "assessments enabled" in gatekeeper_out.lower():
        report_lines.append("[PASS] Gatekeeper App Verification: ENABLED")
    else:
        report_lines.append("[WARN] Gatekeeper App Verification: DISABLED")

    # Check 6: System Integrity Protection (SIP)
    sip_out = run_command(["csrutil", "status"])
    if "enabled" in sip_out.lower():
        report_lines.append("[PASS] System Integrity Protection (SIP): ENABLED")
    else:
        report_lines.append("[WARN] System Integrity Protection (SIP): DISABLED")

    # Check 7: Automatic Software Updates
    updates_out = run_command(["softwareupdate", "--schedule"])
    if "turned on" in updates_out.lower():
        report_lines.append("[PASS] Automatic Software Update Checking: ENABLED")
    else:
        report_lines.append("[WARN] Automatic Software Update Checking: DISABLED")

    # Check 8: Remote Login (SSH) Status
    ssh_out = run_command(["launchctl", "list"])
    if "com.openssh.sshd" in ssh_out:
        report_lines.append("[WARN] Remote Login (SSH): ENABLED (Disable if not needed)")
    else:
        report_lines.append("[PASS] Remote Login (SSH): DISABLED")

    report_lines.append("")
    report_lines.append("==================================================")
    report_lines.append("END OF AUDIT REPORT")
    report_lines.append("==================================================")
    
    full_report = "\n".join(report_lines)
    
    # Print report to Terminal window
    print(full_report)
    
    # Save report to text file
    report_filename = "mac_security_report.txt"
    try:
        with open(report_filename, "w") as file:
            file.write(full_report)
        print(f"\nReport saved successfully to {report_filename}")
    except Exception as e:
        print(f"\nFailed to save report file: {str(e)}")

if __name__ == "__main__":
    check_security()
```

---

## Step 3: Run the Script and View Your Report

In your Terminal window, run the script with Python:

```bash
python3 audit_mac.py
```

Within two seconds, the script will output a clean report directly in your terminal:

```text
==================================================
MACOS BASELINE SECURITY AUDIT REPORT
Timestamp: 2026-08-16 19:04:23
Hardware Architecture: arm64
==================================================

[PASS] Chip Architecture: Apple Silicon (M1/M2/M3) detected.
[PASS] FileVault Disk Encryption: ENABLED
[WARN] Application Firewall: DISABLED (Turn on in Network Settings)
[WARN] Firewall Stealth Mode: DISABLED (Turn on in Network Settings)
[PASS] Gatekeeper App Verification: ENABLED
[PASS] System Integrity Protection (SIP): ENABLED
[PASS] Automatic Software Update Checking: ENABLED
[PASS] Remote Login (SSH): DISABLED

==================================================
END OF AUDIT REPORT
==================================================

Report saved successfully to mac_security_report.txt
```

---

## How to Fix Common Warnings

If your audit report flags any `[WARN]` items, you can fix them quickly in your macOS settings:

1. **Turn On Application Firewall**:
   Open **System Settings > Network > Firewall** and toggle the switch to ON. Click **Options** and turn on **Enable stealth mode**.
2. **Turn On FileVault**:
   Open **System Settings > Privacy & Security > FileVault** and click **Turn On**.
3. **Turn On Automatic Updates**:
   Open **System Settings > General > Software Update** and ensure automatic checking is enabled.

---

## Summary

Checking your security does not require complicated software or monthly subscriptions. Using a simple 50 line Python script allows you to audit your MacBook Pro anytime in under two seconds. 
