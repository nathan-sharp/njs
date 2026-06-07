$ErrorActionPreference = 'Stop'

$controlDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceUrl = 'https://stuff.mit.edu/afs/sipb/contrib/pi/pi-billion.txt'

# Download only the leading bytes needed to recover at least 10,000,000 digits.
# The source includes punctuation and line breaks, so this range is intentionally larger.
$rangeEnd = 12000000

Write-Host 'Requesting control data from MIT pi-billion source...'
$rawText = curl.exe -L --silent --range ("0-{0}" -f $rangeEnd) $sourceUrl
$digits = [regex]::Replace([string]$rawText, '\D', '')

if ($digits.Length -lt 10000000) {
    throw "Received only $($digits.Length) digits from source range; increase rangeEnd in this script."
}

$tiers = @(
    @{ Name = 'pi-10k.txt'; Digits = 10000 },
    @{ Name = 'pi-100k.txt'; Digits = 100000 },
    @{ Name = 'pi-500k.txt'; Digits = 500000 },
    @{ Name = 'pi-1m.txt'; Digits = 1000000 },
    @{ Name = 'pi-10m.txt'; Digits = 10000000 }
)

foreach ($tier in $tiers) {
    $subset = $digits.Substring(0, $tier.Digits)
    $outFile = Join-Path $controlDir $tier.Name
    [System.IO.File]::WriteAllText($outFile, $subset, [System.Text.Encoding]::ASCII)
    Write-Host ("Wrote {0} ({1} digits)" -f $tier.Name, $tier.Digits)
}

Write-Host 'Control file generation complete.'
