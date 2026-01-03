#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include <sstream>
#include <thread>
#include <chrono>
#include <cstdlib>
#include <algorithm>

// --- Configuration ---
const std::string VERSION = "2.0.0 (Native Fox)";
const std::string MAGIC_HEADER = "UWU!";

// --- Colors ---
const std::string ANSI_RESET = "\033[0m";
const std::string ANSI_PURPLE = "\033[0;35m"; 
const std::string ANSI_CYAN = "\033[0;36m";
const std::string ANSI_GREEN = "\033[0;32m";

void Log(const std::string& level, const std::string& message) {
    std::cout << ANSI_PURPLE << "[PAWS] " << ANSI_CYAN << level << ": " << ANSI_RESET << message << std::endl;
}

// --- The UwuScript Interpreter Engine ---

std::map<std::string, std::string> memory;

std::string Resolve(std::string token) {
    // If token starts with $, it's a variable
    if (token.size() > 0 && token[0] == '$') {
        std::string varName = token.substr(1);
        if (memory.find(varName) != memory.end()) {
            return memory[varName];
        }
        return ""; // Undefined
    }
    // Remove quotes if present
    if (token.size() >= 2 && token.front() == '"' && token.back() == '"') {
        return token.substr(1, token.size() - 2);
    }
    return token;
}

void ExecuteScript(const std::string& scriptPath) {
    std::ifstream file(scriptPath);
    if (!file.is_open()) {
        Log("FATAL", "Could not read entry point script.");
        return;
    }

    std::string line;
    while (std::getline(file, line)) {
        // Simple tokenizer
        std::stringstream ss(line);
        std::string cmd;
        ss >> cmd;

        if (cmd == "PRINT") {
            std::string part;
            while (ss >> part) {
                std::cout << Resolve(part) << " ";
            }
            std::cout << std::endl;
        } 
        else if (cmd == "INPUT") {
            std::string varName, promptPart, fullPrompt;
            ss >> varName; // First arg is variable name (e.g. $name)
            
            // Rest of line is prompt
            while (ss >> promptPart) fullPrompt += promptPart + " ";
            if (!fullPrompt.empty() && fullPrompt.front() == '"') fullPrompt = fullPrompt.substr(1);
            if (!fullPrompt.empty() && fullPrompt.back() == '"') fullPrompt.pop_back();

            std::cout << fullPrompt;
            std::string userInput;
            std::getline(std::cin, userInput);
            
            if (varName[0] == '$') varName = varName.substr(1);
            memory[varName] = userInput;
        }
        else if (cmd == "SLEEP") {
            int ms;
            ss >> ms;
            std::this_thread::sleep_for(std::chrono::milliseconds(ms));
        }
    }
}

// --- Main Runtime ---

int main(int argc, char* argv[]) {
    std::cout << "\033]0;P.A.W.S. Native VM\007";
    std::cout << ANSI_PURPLE << "P.A.W.S. Native VM " << ANSI_RESET << VERSION << std::endl;
    std::cout << "------------------------------------------------" << std::endl;

    if (argc < 2) return 0;
    std::string targetFile = argv[1];

    // 1. Check Header
    std::ifstream f(targetFile, std::ios::binary);
    if (!f.is_open()) return 1;
    char buf[4];
    f.read(buf, 4);
    if (std::string(buf, 4) != MAGIC_HEADER) {
        Log("ERROR", "Invalid .uwu header.");
        return 1;
    }
    f.close();

    // 2. Unpack
    // NOTE: In a production app, we would use #include <miniz.h> here.
    // We use the system call purely to keep this code file single-source and copy-pasteable.
    std::string tempDen = "/tmp/paws_vm_" + std::to_string(time(nullptr));
    std::string cmd = "mkdir -p " + tempDen + " && unzip -qq -o \"" + targetFile + "\" -d " + tempDen;
    system(cmd.c_str());

    Log("BOOT", "Loading UwuScript Bytecode...");
    
    // 3. Run Internal Interpreter
    // We assume entry point is always 'main.uwu' for native apps
    ExecuteScript(tempDen + "/src/main.uwu");

    // 4. Cleanup
    system(("rm -rf " + tempDen).c_str());
    Log("NAP", "Session ended.");

    return 0;
}