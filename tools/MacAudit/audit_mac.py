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