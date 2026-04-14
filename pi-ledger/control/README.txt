Pi Ledger Control Files

This folder stores precomputed control digits used by pi-ledger/index.html.

Expected files:
- pi-10k.txt   (10,000 digits)
- pi-100k.txt  (100,000 digits)
- pi-500k.txt  (500,000 digits)
- pi-1m.txt    (1,000,000 digits)
- pi-10m.txt   (10,000,000 digits)

Generation
1. Open PowerShell in this folder.
2. Run:
   .\fetch-control-files.ps1

Source used by the script
- https://stuff.mit.edu/afs/sipb/contrib/pi/pi-billion.txt

Behavior
- The Pi Ledger page loads these local files for comparison.
- If files are missing, the analyzer shows an error telling you to populate ./control/.
- Digits are expected to be plain ASCII numeric characters only.
