import os
import shutil
import subprocess

TEMPLATE_DIR = "/app/System/Templates/Universal_Agency"
AGENCIES_DIR = "/app/Agencies"

def forge_agency(agency_name: str, role: str):
    """
    Creates a new agency from the Universal Template.
    """
    print(f"[*] Foundry initializing new agency: {agency_name}...")
    target_dir = os.path.join(AGENCIES_DIR, agency_name)
    
    if os.path.exists(target_dir):
        print(f"[!] Error: Agency '{agency_name}' already exists.")
        return False
        
    try:
        # Step 1: Copy Template
        shutil.copytree(TEMPLATE_DIR, target_dir)
        print(f"[*] Template copied to {target_dir}")
        
        # Step 2: Write Persona
        persona_path = os.path.join(target_dir, "State", "Persona.md")
        with open(persona_path, "w") as f:
            f.write(f"# Core Persona\n\n**Name:** {agency_name}\n**Role:** {role}\n")
        
        # Step 3: Initialize Git Repo (Fleet Model)
        subprocess.run(["git", "init"], cwd=target_dir, check=True)
        print(f"[*] Initialized independent Git repository for {agency_name}.")
        
        print(f"[+] Successfully forged {agency_name}!")
        return True
        
    except Exception as e:
        print(f"[-] Foundry forging failed: {e}")
        return False

if __name__ == "__main__":
    print("Foundry Agency standing by.")
    # Example usage: forge_agency("TestAgency", "Quality Assurance Bot")
