@echo off
REM ============================================================================
REM AuraFit C Engine - Windows Build Script
REM Detects GCC (MinGW), Clang, or MSVC (cl.exe) and compiles the application.
REM ============================================================================

setlocal enabledelayedexpansion
echo [AuraFit] Detecting C Compiler...

where gcc >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [AuraFit] Found GCC. Compiling Standalone and Modular targets...
    gcc -O2 -std=c99 -Wall aurafit_standalone.c -o aurafit.exe -lm
    if %ERRORLEVEL% equ 0 (
        echo [AuraFit] Build Successful: aurafit.exe generated!
        echo [AuraFit] Running automated algorithmic tests...
        aurafit.exe --test
        exit /b 0
    ) else (
        echo [AuraFit] Compilation failed with GCC.
        exit /b 1
    )
)

where clang >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [AuraFit] Found Clang. Compiling...
    clang -O2 -std=c99 -Wall aurafit_standalone.c -o aurafit.exe -lm
    if %ERRORLEVEL% equ 0 (
        echo [AuraFit] Build Successful: aurafit.exe generated!
        aurafit.exe --test
        exit /b 0
    )
)

where cl.exe >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [AuraFit] Found MSVC (cl.exe). Compiling...
    cl /O2 /W3 /D_CRT_SECURE_NO_WARNINGS aurafit_standalone.c /Fe:aurafit.exe
    if %ERRORLEVEL% equ 0 (
        echo [AuraFit] Build Successful: aurafit.exe generated!
        aurafit.exe --test
        exit /b 0
    )
)

echo [!] Error: No C compiler found in PATH.
echo [!] Please install MinGW-w64 (gcc) or Visual Studio C++ build tools.
exit /b 1
