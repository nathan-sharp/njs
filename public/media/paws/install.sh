#!/bin/sh
# This script installs P.A.W.S. (Platform Agnostic Wrapper Service)
# Usage: curl -fsSL https://njs.dev/media/paws/install.sh | sh

set -e

# --- Configuration ---
# Update this to your actual file host
BASE_URL="https://njs.dev/media/paws/install.sh"
BIN_NAME="paws"
INSTALL_DIR="/usr/local/bin"

# --- Detect Operating System ---
OS="$(uname -s)"
case "$OS" in
    Linux)
        OS_TYPE="linux"
        ;;
    Darwin)
        OS_TYPE="darwin"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        echo "Detected Windows environment (Git Bash/MinGW)."
        echo "For best results on Windows, please use PowerShell:"
        echo "iwr https://your-site.com/install.ps1 | iex"
        exit 1
        ;;
    *)
        echo "Unsupported operating system: $OS"
        exit 1
        ;;
esac

# --- Detect Architecture ---
ARCH="$(uname -m)"
case "$ARCH" in
    x86_64|amd64)
        ARCH_TYPE="amd64"
        ;;
    aarch64|arm64)
        ARCH_TYPE="arm64"
        ;;
    *)
        echo "Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

# Construct the specific binary name (e.g., paws-linux-amd64)
TARGET_BINARY="${BIN_NAME}-${OS_TYPE}-${ARCH_TYPE}"
DOWNLOAD_URL="${BASE_URL}/${TARGET_BINARY}"

# --- Installation Steps ---

echo "--- Installing P.A.W.S. ---"
echo "Detected: ${OS_TYPE} (${ARCH_TYPE})"

# Check for sudo/root permissions if installing to /usr/local/bin
if [ ! -w "$INSTALL_DIR" ]; then
    echo "Need sudo access to install to ${INSTALL_DIR}"
    SUDO="sudo"
else
    SUDO=""
fi

echo "Downloading ${TARGET_BINARY}..."

# Download logic (curl or wget)
if command -v curl >/dev/null 2>&1; then
    $SUDO curl -fsSL "$DOWNLOAD_URL" -o "$INSTALL_DIR/$BIN_NAME"
elif command -v wget >/dev/null 2>&1; then
    $SUDO wget -qO "$INSTALL_DIR/$BIN_NAME" "$DOWNLOAD_URL"
else
    echo "Error: Neither curl nor wget was found."
    exit 1
fi

# Make executable
echo "Setting permissions..."
$SUDO chmod +x "$INSTALL_DIR/$BIN_NAME"

# Linux specific: Register binfmt_misc if applicable
if [ "$OS_TYPE" = "linux" ]; then
    if [ -d "/proc/sys/fs/binfmt_misc" ]; then
        echo "Registering .uwu file extension support..."
        # This step quietly tries to register the format. 
        # It might fail if not running as strict root, so we ignore errors (|| true).
        $SUDO "$INSTALL_DIR/$BIN_NAME" --register-linux || true
    fi
fi

echo ""
echo "Success! P.A.W.S. installed to $INSTALL_DIR/$BIN_NAME"
echo "Run 'paws --version' to verify."
