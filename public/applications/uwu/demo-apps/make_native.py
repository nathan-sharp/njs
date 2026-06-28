import json
import zipfile
import os

def create_native_uwu():
    filename = "native_hello.uwu"
    print(f"Generating {filename}...")

    # 1. Manifest
    manifest = {
        "id": "com.example.native",
        "engine": "paws-native-v1"
    }

    # 2. THE CUSTOM CODE (UwuScript)
    # This is not Python. It is our custom language.
    # Syntax: 
    #   PRINT "String" $variable
    #   INPUT $variable "Prompt String"
    #   SLEEP ms
    script_content = """
PRINT "--- PAWS NATIVE VM ---"
PRINT "This is running directly on the engine."
SLEEP 500
PRINT ""
INPUT $username "Please enter your name: "
PRINT "Processing..."
SLEEP 800
PRINT ""
PRINT "Hello" $username "! Welcome to the ecosystem."
PRINT "Exiting..."
SLEEP 1000
"""

    # 3. Zip
    zip_filename = "temp.zip"
    with zipfile.ZipFile(zip_filename, 'w') as zf:
        zf.writestr('collar.json', json.dumps(manifest))
        zf.writestr('src/main.uwu', script_content)

    # 4. Header
    magic_header = b'\x55\x57\x55\x21'
    with open(zip_filename, 'rb') as f_in:
        data = f_in.read()
    
    with open(filename, 'wb') as f_out:
        f_out.write(magic_header)
        f_out.write(data)

    os.remove(zip_filename)
    print("Success. Run with: ./paws native_hello.uwu")

if __name__ == "__main__":
    create_native_uwu()
