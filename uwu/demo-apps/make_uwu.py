import json
import zipfile
import os
import struct

def create_example_uwu():
    filename = "PawPad.uwu"
    
    print(f"Generating {filename}...")

    # 1. Define the collar.json (Manifest)
    # This matches the spec defined in your documentation
    manifest = {
        "display_name": "PawPad",
        "package_id": "com.softpaw.editor",
        "version": "1.2.0",
        "engine": {
            "target": "paws-standard",
            "min_memory": "256MB"
        },
        "attributes": {
            "species": "utility/text-editor",
            "temperament": "social", # Allowed to talk to network
            "habitat": "desktop"
        },
        "entry_point": "src/main.py"
    }

    # 2. Define the Application Logic (src/main.py)
    # This is the mock application the runtime will execute
    app_code = """
import time
import sys

def run():
    print("\\n[PawPad] Initializing soft interface...")
    time.sleep(0.5)
    print("[PawPad] Welcome to PawPad v1.2.0!")
    print("[PawPad] -------------------------")
    print("[PawPad] Status: Online and soft.")
    print("[PawPad] Type 'exit' to close or 'nap' to sleep.\\n")
    
    while True:
        try:
            # Python 2/3 compatibility for input
            try:
                cmd = raw_input("PawPad> ")
            except NameError:
                cmd = input("PawPad> ")
                
            if cmd.lower() == "exit":
                print("[PawPad] Closing den. Goodbye!")
                break
            elif cmd.lower() == "nap":
                print("[PawPad] zzz...")
                time.sleep(1)
                print("[PawPad] Woke up refreshed!")
            else:
                print(f"[PawPad] You typed: {cmd}")
        except KeyboardInterrupt:
            print("\\n[PawPad] Force close detected.")
            break

if __name__ == "__main__":
    run()
"""

    # 3. Create a temporary Zip Archive
    zip_filename = "temp_archive.zip"
    with zipfile.ZipFile(zip_filename, 'w') as zf:
        # Add manifest
        zf.writestr('collar.json', json.dumps(manifest, indent=2))
        # Add code
        zf.writestr('src/main.py', app_code)
        # Add a dummy asset file
        zf.writestr('assets/icon.dat', b'placeholder_image_data')

    # 4. Construct the Final .uwu File
    # Format: [Magic Bytes 4 bytes] + [Zip Archive Data]
    # Magic Header: U W U ! (0x55 0x57 0x55 0x21)
    magic_header = b'\x55\x57\x55\x21'

    with open(zip_filename, 'rb') as f_in:
        zip_data = f_in.read()

    with open(filename, 'wb') as f_out:
        f_out.write(magic_header)
        f_out.write(zip_data)

    # Cleanup temp file
    os.remove(zip_filename)
    
    print(f"Success! Generated '{filename}'.")
    print(f"File Size: {len(magic_header) + len(zip_data)} bytes")
    print("You can now run this file using your compiled 'paws' runtime.")

if __name__ == "__main__":
    create_example_uwu()
