#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <thread>
#include <chrono>
#include <unistd.h> // For access() and standard POSIX calls

// --- Configuration ---
const std::string VERSION = "0.1.0";
const std::string MAGIC_HEADER = "UWU!"; // 0x55 0x57 0x55 0x21

// --- ANSI Colors ---
const std::string ANSI_RESET = "\033[0m";
const std::string ANSI_RED = "\033[0;31m";
const std::string ANSI_GREEN = "\033[0;32m";
const std::string ANSI_YELLOW = "\033[0;33m";
const std::string ANSI_BLUE = "\033[0;34m";
const std::string ANSI_PURPLE = "\033[0;35m"; 
const std::string ANSI_CYAN = "\033[0;36m";
const std::string ANSI_WHITE = "\033[0;37m";

// --- Logger Helper ---
void Log(const std::string& level, const std::string& message, const std::string& color = ANSI_WHITE) {
    std::cout << ANSI_PURPLE << "[PAWS] ";
    
    if (level == "ERROR") std::cout << ANSI_RED;
    else if (level == "WARN") std::cout << ANSI_YELLOW;
    else std::cout << ANSI_CYAN;
    
    std::cout << level << " ";
    
    std::cout << color << ": " << message << ANSI_RESET << std::endl;
}

// --- Core Logic ---

bool CheckHeader(const std::string& filepath) {
    std::ifstream file(filepath, std::ios::binary);
    if (!file.is_open()) return false;

    char buffer[4];
    file.read(buffer, 4);
    return (buffer[0] == 'U' && buffer[1] == 'W' && buffer[2] == 'U' && buffer[3] == '!');
}

void SimulateBootSequence(const std::string& filename) {
    Log("SCENT", "Scenting environment variables...");
    std::this_thread::sleep_for(std::chrono::milliseconds(400));
    Log("SCENT", "Environment is clean.", ANSI_GREEN);

    Log("GROOM", "Unwrapping " + filename + "...");
    std::this_thread::sleep_for(std::chrono::milliseconds(800));
    
    Log("CHECK", "Reading collar.json...");
    std::this_thread::sleep_for(std::chrono::milliseconds(300));
    Log("CHECK", "Temperament: SOCIAL (Allowed to purr at network)", ANSI_YELLOW);
    
    Log("BOOT", "Starting application den...", ANSI_GREEN);
    std::this_thread::sleep_for(std::chrono::milliseconds(500));
    std::cout << std::endl;
}

int main(int argc, char* argv[]) {
    // Set Console Title
    std::cout << "\033]0;P.A.W.S. Runtime - " << VERSION << "\007";

    // Header
    std::cout << ANSI_PURPLE << "P.A.W.S. " << ANSI_WHITE 
              << "Platform Agnostic Wrapper Service " << VERSION << ANSI_RESET << std::endl;
    std::cout << "------------------------------------------------" << std::endl;

    // Argument Check
    if (argc < 2) {
        Log("WARN", "No input unit provided.");
        std::cout << "Usage: ./paws <file.uwu>" << std::endl;
        std::cout << "       ./paws --version" << std::endl;
        return 1;
    }

    std::string arg1 = argv[1];

    // --- FIX: Check for version flag before checking for file existence ---
    if (arg1 == "--version" || arg1 == "-v") {
        // We already printed the header at the top, so we just exit successfully.
        return 0;
    }

    // Now treat arg1 as a filename
    if (access(arg1.c_str(), F_OK) == -1) {
        Log("ERROR", "Could not sniff out file: " + arg1);
        Log("HINT", "Are you sure it exists in this habitat?");
        return 1;
    }

    if (!CheckHeader(arg1)) {
        Log("ERROR", "Invalid file signature.");
        Log("INFO", "Header does not match 'UWU!'. Is this a valid unit?");
        return 1;
    }

    SimulateBootSequence(arg1);

    std::cout << "--- Application Output ---" << std::endl;
    std::cout << "Welcome to PawPad v1.0!" << std::endl;
    std::cout << "Type 'exit' to close." << std::endl;
    
    std::string input;
    while (true) {
        std::cout << "> ";
        std::getline(std::cin, input);
        if (input == "exit") break;
    }

    Log("NAP", "Process is tucking in. Goodnight.");
    return 0;
}
