# get-media-v2.ps1
[CmdletBinding()]
param()

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.IsGenericMethod })[0]

function Get-WinRTResult($AsyncOp, $Type) {
    try {
        $asTask = $asTaskGeneric.MakeGenericMethod($Type)
        $task = $asTask.Invoke($null, @($AsyncOp))
        $task.Wait()
        return $task.Result
    } catch {
        return $null
    }
}

[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null
$managerAsync = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
$manager = Get-WinRTResult $managerAsync ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

if (-not $manager) { Write-Output '{"error": "Manager not found"}'; exit }

$session = $manager.GetCurrentSession()
if ($session) {
    $propsAsync = $session.TryGetMediaPropertiesAsync()
    $props = Get-WinRTResult $propsAsync ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
    
    $res = @{
        title = $props.Title
        artist = $props.Artist
        album = $props.AlbumTitle
        appId = $session.SourceAppId
        status = $session.GetPlaybackInfo().PlaybackStatus.ToString().ToLower()
    }
    
    if ($props.Thumbnail) {
        try {
            $streamAsync = $props.Thumbnail.OpenReadAsync()
            $stream = Get-WinRTResult $streamAsync ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
            if ($stream) {
                $reader = New-Object Windows.Storage.Streams.DataReader($stream)
                $loadAsync = $reader.LoadAsync($stream.Size)
                $null = Get-WinRTResult $loadAsync ([uint32])
                $bytes = New-Object byte[]($stream.Size)
                $reader.ReadBytes($bytes)
                $res.thumbnail = [Convert]::ToBase64String($bytes)
            }
        } catch {}
    }
    
    $res | ConvertTo-Json
} else {
    Write-Output '{"status": "idle"}'
}
