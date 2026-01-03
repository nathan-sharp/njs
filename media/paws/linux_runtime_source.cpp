#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <thread>
#include <chrono>
#include <unistd.h> // For access() and standard POSIX calls

// --- Configuration ---
const std::string VERSION = "1.2.0";
const std::string MAGIC_HEADER = "UWU!"; // 0x55 0x57 0x55 0x21

// --- ANSI Colors ---
const std::string ANSI_RESET = "\033[0m";
const std::string ANSI_RED = "\033[0;31m";
const std::string ANSI_GREEN = "\033[0;32m";
const std::string ANSI_YELLOW = "\033[0;33m";
const std::string ANSI_BLUE = "\033[0;34m";
const std::string ANSI_PURPLE = "\033[0;35m"; // The UWU Brand Color
const std::string ANSI_CYAN = "\033[0;36m";
const std::string ANSI_WHITE = "\033[0;37m";

// --- Logger Helper ---
// "Fuzzier" logging as per spec
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
    
    // Check for the magic bytes "UWU!"
    return (buffer[0] == 'U' && buffer[1] == 'W' && buffer[2] == 'U' && buffer[3] == '!');
}

void SimulateBootSequence(const std::string& filename) {
    // 1. Scenting
    Log("SCENT", "Scenting environment variables...");
    std::this_thread::sleep_for(std::chrono::milliseconds(400));
    Log("SCENT", "Environment is clean.", ANSI_GREEN);

    // 2. Unwrapping
    Log("GROOM", "Unwrapping " + filename + "...");
    std::this_thread::sleep_for(std::chrono::milliseconds(800));
    
    // 3. Temperament Check
    Log("CHECK", "Reading collar.json...");
    std::this_thread::sleep_for(std::chrono::milliseconds(300));
    Log("CHECK", "Temperament: SOCIAL (Allowed to purr at network)", ANSI_YELLOW);
    
    // 4. Launch
    Log("BOOT", "Starting application den...", ANSI_GREEN);
    std::this_thread::sleep_for(std::chrono::milliseconds(500));
    std::cout << std::endl;
}

int main(int argc, char* argv[]) {
    // Set Console Title using ANSI escape sequence
    std::cout << "\033]0;P.A.W.S. Runtime - " << VERSION << "\007";

    // Header
    std::cout << ANSI_PURPLE << "P.A.W.S. " << ANSI_WHITE 
              << "Platform Agnostic Wrapper Service " << VERSION << ANSI_RESET << std::endl;
    std::cout << "------------------------------------------------" << std::endl;

    // Argument Check
    if (argc < 2) {
        Log("WARN", "No input unit provided.");
        std::cout << "Usage: ./paws <file.uwu>" << std::endl;
        std::cout << "       ./paws --chonk <dir>" << std::endl;
        return 1;
    }

    std::string targetFile = argv[1];

    // Check File Existence using POSIX access()
    if (access(targetFile.c_str(), F_OK) == -1) {
        Log("ERROR", "Could not sniff out file: " + targetFile);
        Log("HINT", "Are you sure it exists in this habitat?");
        return 1;
    }

    // Check Magic Bytes
    if (!CheckHeader(targetFile)) {
        Log("ERROR", "Invalid file signature.");
        Log("INFO", "Header does not match 'UWU!'. Is this a valid unit?");
        return 1;
    }

    // Run Simulation
    SimulateBootSequence(targetFile);

    // Handover to App Logic (Simulated)
    std::cout << "--- Application Output ---" << std::endl;
    std::cout << "Welcome to PawPad v1.0!" << std::endl;
    std::cout << "Type 'exit' to close." << std::endl;
    
    // Keep window open until user exits
    std::string input;
    while (true) {
        std::cout << "> ";
        std::getline(std::cin, input);
        if (input == "exit") break;
    }

    Log("NAP", "Process is tucking in. Goodnight.");
    return 0;
}
