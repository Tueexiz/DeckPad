# get-media.ps1
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.IsGenericMethod })[0]

function Get-WinRTResult($AsyncOp, $Type) {
    $asTask = $asTaskGeneric.MakeGenericMethod($Type)
    $task = $asTask.Invoke($null, @($AsyncOp))
    $task.Wait()
    return $task.Result
}

[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null
$managerAsync = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
$manager = Get-WinRTResult $managerAsync ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

$session = $manager.GetCurrentSession()
if ($session) {
    $propsAsync = $session.TryGetMediaPropertiesAsync()
    $props = Get-WinRTResult $propsAsync ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
    
    $result = @{
        Title = $props.Title
        Artist = $props.Artist
        Album = $props.AlbumTitle
        AppId = $session.SourceAppId
    }
    
    if ($props.Thumbnail) {
        $streamAsync = $props.Thumbnail.OpenReadAsync()
        $stream = Get-WinRTResult $streamAsync ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
        $reader = New-Object Windows.Storage.Streams.DataReader($stream)
        $loadAsync = $reader.LoadAsync($stream.Size)
        $null = Get-WinRTResult $loadAsync ([uint32])
        $bytes = New-Object byte[]($stream.Size)
        $reader.ReadBytes($bytes)
        $result.Thumbnail = [Convert]::ToBase64String($bytes)
    }
    
    $result | ConvertTo-Json
} else {
    Write-Error "No active session"
}
