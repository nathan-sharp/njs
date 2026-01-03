#!/bin/bash

# P.A.W.S. Installer for Linux & macOS
# -----------------------------------

set -e

# --- Configuration ---
BINARY_URL="https://njs.dev/media/paws/paws_linux"
INSTALL_DIR="$HOME/.paws"
BIN_NAME="paws"

# --- Colors ---
PURPLE='\033[0;35m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "   ___      _    __      __    ___   "
echo "  | _ \    /_\   \ \    / /   / __|  "
echo "  |  _/   / _ \   \ \/\/ /    \__ \  "
echo "  |_|    /_/ \_\   \_/\_/     |___/  "
echo -e "${NC}"
echo "  Platform Agnostic Wrapper Service"
echo "  ---------------------------------"

# 1. Prepare Directory
echo -e "Directory: ${INSTALL_DIR}"
mkdir -p "$INSTALL_DIR/bin"

# 2. Download Binary
echo -e "Downloading core runtime..."
# In a real scenario, curl would download the binary. 
# For this demo, we mock it if the URL is just a placeholder.
if [ "$BINARY_URL" == "https://your-website.com/downloads/paws-binary" ]; then
    echo -e "${PURPLE}[DEV MODE]${NC} Creating dummy binary for testing..."
    touch "$INSTALL_DIR/bin/$BIN_NAME"
    echo "#!/bin/bash" > "$INSTALL_DIR/bin/$BIN_NAME"
    echo "echo '[PAWS] Runtime Active (Mock)'" >> "$INSTALL_DIR/bin/$BIN_NAME"
else
    curl -L "$BINARY_URL" -o "$INSTALL_DIR/bin/$BIN_NAME" --progress-bar
fi

# 3. Make Executable
chmod +x "$INSTALL_DIR/bin/$BIN_NAME"

# 4. Add to PATH (Bash/Zsh support)
echo -e "Configuring path..."
SHELL_CONFIG=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
fi

if [ -n "$SHELL_CONFIG" ]; then
    if ! grep -q "$INSTALL_DIR/bin" "$SHELL_CONFIG"; then
        echo "export PATH=\"\$PATH:$INSTALL_DIR/bin\"" >> "$SHELL_CONFIG"
        echo -e "${GREEN}Added to $SHELL_CONFIG${NC}"
    else
        echo "Path already configured."
    fi
fi

# 5. Linux Specific: Register .uwu extension (binfmt_misc)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "Registering .uwu extension..."
    # This usually requires sudo, so we warn the user
    echo -e "${PURPLE}Note:${NC} To run .uwu files directly, you may need to register the binfmt."
    echo -e "Run: sudo $INSTALL_DIR/bin/$BIN_NAME --register-linux"
fi

echo -e "${GREEN}Success!${NC} P.A.W.S. has been installed."
echo -e "Restart your terminal or run: source $SHELL_CONFIG"