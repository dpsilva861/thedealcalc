# FileOrganizer PowerShell Module
# Provides search and management commands for the File Organizer system.
#
# Installation:
#   Copy this file to a folder in your PSModulePath, then:
#   Import-Module FileOrganizer
#
# Or add to your PowerShell profile:
#   Import-Module "C:\path\to\FileOrganizer.psm1"

$script:PythonExe = "python"
$script:FOCommand = "file-organizer"

function Set-FileOrganizerPython {
    <#
    .SYNOPSIS
    Set the Python executable path for the File Organizer.
    #>
    param(
        [Parameter(Mandatory)]
        [string]$PythonPath
    )
    $script:PythonExe = $PythonPath
}

function Invoke-FOCommand {
    <#
    .SYNOPSIS
    Internal: invoke the file-organizer CLI.
    #>
    param(
        [Parameter(Mandatory)]
        [string[]]$Arguments
    )
    $allArgs = @("-m", "file_organizer.cli.main") + $Arguments
    & $script:PythonExe @allArgs
}

function Search-Files {
    <#
    .SYNOPSIS
    Search the file inventory using natural language or filters.

    .DESCRIPTION
    Supports full-text search, tag search, date ranges, entity filters,
    and fuzzy matching.

    .EXAMPLE
    Search-Files "all leases for 24 Hour Fitness"

    .EXAMPLE
    Search-Files "financial models" -Status active

    .EXAMPLE
    Search-Files -Tags "aliso-viejo,TI-allowance"

    .EXAMPLE
    Search-Files "tax documents" -DateStart "2025-01-01" -DateEnd "2025-12-31"
    #>
    [CmdletBinding()]
    param(
        [Parameter(Position = 0, ValueFromPipeline)]
        [string]$Query = "",

        [string]$Tags = "",
        [string]$Category = "",
        [string]$Entity = "",
        [string]$Type = "",
        [string]$Status = "",
        [string]$DateStart = "",
        [string]$DateEnd = "",
        [int]$Limit = 50,
        [switch]$AsJson
    )

    $args = @("search")
    if ($Query) { $args += $Query }
    if ($Tags) { $args += "--tags"; $args += $Tags }
    if ($Category) { $args += "--category"; $args += $Category }
    if ($Entity) { $args += "--entity"; $args += $Entity }
    if ($Type) { $args += "--type"; $args += $Type }
    if ($Status) { $args += "--status"; $args += $Status }
    if ($DateStart) { $args += "--date-start"; $args += $DateStart }
    if ($DateEnd) { $args += "--date-end"; $args += $DateEnd }
    if ($Limit -ne 50) { $args += "--limit"; $args += $Limit.ToString() }
    if ($AsJson) { $args += "--json-output" }

    Invoke-FOCommand -Arguments $args
}

function Get-FileProfile {
    <#
    .SYNOPSIS
    Show the file landscape profile.
    #>
    [CmdletBinding()]
    param(
        [switch]$AsJson
    )

    $args = @("profile")
    if ($AsJson) { $args += "--json-output" }
    Invoke-FOCommand -Arguments $args
}

function Start-FileScan {
    <#
    .SYNOPSIS
    Scan directories and build the file inventory.

    .EXAMPLE
    Start-FileScan "C:\Users\dpsil\Documents"

    .EXAMPLE
    Start-FileScan -DryRun
    #>
    [CmdletBinding()]
    param(
        [Parameter(Position = 0)]
        [string[]]$Directories,

        [switch]$NoContent,
        [switch]$NoHash,
        [switch]$DryRun
    )

    $args = @("scan")
    if ($Directories) { $args += $Directories }
    if ($NoContent) { $args += "--no-content" }
    if ($NoHash) { $args += "--no-hash" }
    if ($DryRun) { $args += "--dry-run" }

    Invoke-FOCommand -Arguments $args
}

function Show-Taxonomy {
    <#
    .SYNOPSIS
    Show or create the proposed folder taxonomy.
    #>
    [CmdletBinding()]
    param(
        [switch]$Create,
        [switch]$AsJson
    )

    $args = @("taxonomy")
    if ($Create) { $args += "--create" }
    if ($AsJson) { $args += "--json-output" }
    Invoke-FOCommand -Arguments $args
}

function Start-FileOrganize {
    <#
    .SYNOPSIS
    Execute file organization based on classifications.
    #>
    [CmdletBinding()]
    param(
        [switch]$DryRun,
        [string]$Manifest = ""
    )

    $args = @("organize")
    if ($DryRun) { $args += "--dry-run" }
    if ($Manifest) { $args += "--manifest"; $args += $Manifest }
    Invoke-FOCommand -Arguments $args
}

function Start-FileClassify {
    <#
    .SYNOPSIS
    Classify a single file.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, Position = 0)]
        [string]$FilePath,

        [switch]$AsJson
    )

    $args = @("classify", $FilePath)
    if ($AsJson) { $args += "--json-output" }
    Invoke-FOCommand -Arguments $args
}

function Start-FileAgent {
    <#
    .SYNOPSIS
    Start the persistent file agent.
    #>
    [CmdletBinding()]
    param(
        [switch]$Foreground,
        [switch]$Tray,
        [switch]$Install,
        [switch]$Uninstall
    )

    $args = @("agent")
    if ($Foreground) { $args += "--foreground" }
    if ($Tray) { $args += "--tray" }
    if ($Install) { $args += "--install" }
    if ($Uninstall) { $args += "--uninstall" }
    Invoke-FOCommand -Arguments $args
}

function Start-FODashboard {
    <#
    .SYNOPSIS
    Launch the web dashboard.
    #>
    [CmdletBinding()]
    param(
        [int]$Port = 5000,
        [string]$Host = "127.0.0.1"
    )

    $args = @("dashboard", "--port", $Port.ToString(), "--host", $Host)
    Invoke-FOCommand -Arguments $args
}

function Undo-FileMove {
    <#
    .SYNOPSIS
    Undo recent file moves.
    #>
    [CmdletBinding()]
    param(
        [int]$Count = 1
    )

    Invoke-FOCommand -Arguments @("undo", "--count", $Count.ToString())
}

function Get-FOStatus {
    <#
    .SYNOPSIS
    Show file organizer system status.
    #>
    Invoke-FOCommand -Arguments @("status")
}

function Find-Duplicates {
    <#
    .SYNOPSIS
    Find duplicate files.
    #>
    [CmdletBinding()]
    param(
        [switch]$Near
    )

    $args = @("duplicates")
    if ($Near) { $args += "--near" }
    Invoke-FOCommand -Arguments $args
}

# Aliases for convenience
Set-Alias -Name fosearch -Value Search-Files
Set-Alias -Name foscan -Value Start-FileScan
Set-Alias -Name foprofile -Value Get-FileProfile
Set-Alias -Name foclassify -Value Start-FileClassify
Set-Alias -Name fostatus -Value Get-FOStatus

# Export functions and aliases
Export-ModuleMember -Function * -Alias *
