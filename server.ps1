$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:8000/")
$listener.Start()
Write-Host "Listening on http://127.0.0.1:8000/"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { $urlPath = "/index.html" }
        
        # Clean path to prevent directory traversal
        $urlPath = $urlPath.Replace("/", "\")
        if ($urlPath.StartsWith("\")) { $urlPath = $urlPath.Substring(1) }
        $filePath = Join-Path "i:\job" $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            
            # Content type mapping
            if ($filePath.EndsWith(".html")) { $response.ContentType = "text/html" }
            elseif ($filePath.EndsWith(".css")) { $response.ContentType = "text/css" }
            elseif ($filePath.EndsWith(".js")) { $response.ContentType = "application/javascript" }
            elseif ($filePath.EndsWith(".png")) { $response.ContentType = "image/png" }
            elseif ($filePath.EndsWith(".jpg") -or $filePath.EndsWith(".jpeg")) { $response.ContentType = "image/jpeg" }
            
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("File Not Found")
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
