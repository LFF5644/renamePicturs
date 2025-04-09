@echo off
set /p "sourceDir=Bilder Ordner: "
if not exist "%sourceDir%" (
	echo Ordner Exestiret nicht!
	pause
	exit
)

set /p "outputDir=Ausgangs Ordner: "
if "%outputDir%"=="" (
	echo Bilder werden im Gleichen Ordner ausgegeben.
	set "outputDir=%sourceDir%"
)
if not exist "%outputDir%" (
	echo Ordner Exestiret nicht!
	pause
	exit
)

set "delete=--delete"
if not "%sourceDir%"=="%outputDir%" (
	echo Sollen die Bilder verschoben werden?
	set /p "anwser=[Y/N]: "
	if "%anwser%"=="N" set "delete="
	if "%anwser%"=="n" set "delete="
)

echo sourceDir: %sourceDir%
echo outputDir: %outputDir%
echo delete: %delete%

echo.
echo "%sourceDir%" "%outputDir%" %delete%
echo.

node main.js "%sourceDir%" "%outputDir%" %delete%

pause

