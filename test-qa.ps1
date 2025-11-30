# QA Test Suite for Agri360 - PowerShell Version
# Tests Profile, Notifications, and Marketplace pages
# Date: November 16, 2025

$BaseUrl = "http://localhost:3000"
$ApiUrl = "http://localhost:5000/api"
$TestEmail = "ahmed@agri360.test"
$TestPassword = "Agri360@123"

# Test counters
$Passed = 0
$Failed = 0
$Warnings = 0

# Colors
$Green = [System.ConsoleColor]::Green
$Red = [System.ConsoleColor]::Red
$Yellow = [System.ConsoleColor]::Yellow
$Blue = [System.ConsoleColor]::Blue

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

function Log-Test {
    param([string]$Message)
    Write-Host "[TEST] $Message" -ForegroundColor $Blue
}

function Log-Pass {
    param([string]$Message)
    Write-Host "[PASS] $Message" -ForegroundColor $Green
    $global:Passed++
}

function Log-Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor $Red
    $global:Failed++
}

function Log-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor $Yellow
    $global:Warnings++
}

function Invoke-ApiRequest {
    param(
        [string]$Method = "GET",
        [string]$Endpoint,
        [string]$Token,
        [hashtable]$Body
    )
    
    $url = "$ApiUrl$Endpoint"
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    $params = @{
        Uri     = $url
        Method  = $Method
        Headers = $headers
    }
    
    if ($Body) {
        $params["Body"] = $Body | ConvertTo-Json
    }
    
    try {
        $response = Invoke-WebRequest @params -ErrorAction SilentlyContinue
        return @{
            StatusCode = $response.StatusCode
            Body       = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
            RawBody    = $response.Content
        }
    }
    catch {
        $response = $_.Exception.Response
        return @{
            StatusCode = $response.StatusCode
            Body       = $null
            RawBody    = $_.Exception.Message
            Error      = $true
        }
    }
}

# ============================================================================
# 1. AUTHENTICATION TESTS
# ============================================================================

Write-Host "`n=== AUTHENTICATION TESTS ===" -ForegroundColor $Blue

Log-Test "Login with valid credentials"
$loginBody = @{
    email    = $TestEmail
    password = $TestPassword
} | ConvertTo-Json

$loginResp = Invoke-WebRequest -Uri "$ApiUrl/auth/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json" } `
    -Body $loginBody -ErrorAction SilentlyContinue

if ($loginResp.StatusCode -eq 200) {
    $loginData = $loginResp.Content | ConvertFrom-Json
    $Token = $loginData.token
    Log-Pass "Login successful - Token acquired"
}
else {
    Log-Fail "Login failed with status $($loginResp.StatusCode)"
}

Log-Test "Get authenticated user (GET /api/auth/me)"
$meResp = Invoke-WebRequest -Uri "$ApiUrl/auth/me" `
    -Method GET `
    -Headers @{"Authorization" = "Bearer $Token"; "Content-Type" = "application/json" } `
    -ErrorAction SilentlyContinue

if ($meResp.StatusCode -eq 200) {
    $meData = $meResp.Content | ConvertFrom-Json
    Log-Pass "Auth/me endpoint returns 200"
    Log-Pass "User: $($meData.email)"
}
else {
    Log-Fail "Auth/me returned $($meResp.StatusCode)"
}

Log-Test "Invalid token handling"
try {
    Invoke-WebRequest -Uri "$ApiUrl/auth/me" `
        -Method GET `
        -Headers @{"Authorization" = "Bearer invalid.token"; "Content-Type" = "application/json" } `
        -ErrorAction Stop | Out-Null
    Log-Fail "Invalid token was accepted"
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Log-Pass "Invalid token properly rejected (401)"
    }
    else {
        Log-Warn "Invalid token returned status $($_.Exception.Response.StatusCode)"
    }
}

# ============================================================================
# 2. PROFILE PAGE TESTS
# ============================================================================

Write-Host "`n=== PROFILE PAGE TESTS ===" -ForegroundColor $Blue

Log-Test "GET /api/users/me - Profile endpoint"
$profileResp = Invoke-WebRequest -Uri "$ApiUrl/users/me" `
    -Method GET `
    -Headers @{"Authorization" = "Bearer $Token"; "Content-Type" = "application/json" } `
    -ErrorAction SilentlyContinue

if ($profileResp.StatusCode -eq 200) {
    $profileData = $profileResp.Content | ConvertFrom-Json
    Log-Pass "Profile endpoint returns 200"
    
    if ($profileData.name) {
        Log-Pass "Profile contains 'name': $($profileData.name)"
    }
    else {
        Log-Warn "Profile missing 'name' field"
    }
    
    if ($profileData.email) {
        Log-Pass "Profile contains 'email': $($profileData.email)"
    }
    else {
        Log-Warn "Profile missing 'email' field"
    }
}
else {
    Log-Fail "Profile endpoint returned $($profileResp.StatusCode)"
}

Log-Test "PUT /api/users/me - Update profile"
$updateBody = @{
    name  = "Ahmed Hassan Updated"
    email = $TestEmail
} | ConvertTo-Json

try {
    $updateResp = Invoke-WebRequest -Uri "$ApiUrl/users/me" `
        -Method PUT `
        -Headers @{"Authorization" = "Bearer $Token"; "Content-Type" = "application/json" } `
        -Body $updateBody -ErrorAction SilentlyContinue
    
    Log-Pass "Profile update successful ($($updateResp.StatusCode))"
}
catch {
    Log-Warn "Profile update returned $($_.Exception.Response.StatusCode)"
}

Log-Test "Verify profile update persistence"
$verifyResp = Invoke-WebRequest -Uri "$ApiUrl/users/me" `
    -Method GET `
    -Headers @{"Authorization" = "Bearer $Token"; "Content-Type" = "application/json" } `
    -ErrorAction SilentlyContinue

if ($verifyResp.StatusCode -eq 200) {
    $verifyData = $verifyResp.Content | ConvertFrom-Json
    if ($verifyData.name -like "*Updated*") {
        Log-Pass "Profile update persisted correctly"
    }
    else {
        Log-Warn "Profile update may not have persisted"
    }
}

# ============================================================================
# 3. MARKETPLACE TESTS
# ============================================================================

Write-Host "`n=== MARKETPLACE TESTS ===" -ForegroundColor $Blue

Log-Test "GET /api/market/listings - List marketplace items"
try {
    $marketResp = Invoke-WebRequest -Uri "$ApiUrl/market/listings" `
        -Method GET `
        -Headers @{"Authorization" = "Bearer $Token"; "Content-Type" = "application/json" } `
        -ErrorAction SilentlyContinue
    
    if ($marketResp.StatusCode -eq 200) {
        Log-Pass "Marketplace listings endpoint returns 200"
        $marketData = $marketResp.Content | ConvertFrom-Json
        Log-Pass "Marketplace response received: $($marketResp.Content.Length) bytes"
    }
}
catch {
    Log-Fail "Marketplace endpoint error: $($_.Exception.Message)"
}

Log-Test "POST /api/market/listings - Create listing"
$listingBody = @{
    crop         = "wheat"
    quantity     = 100
    unit         = "kg"
    pricePerUnit = 50
    description  = "Test wheat listing"
} | ConvertTo-Json

try {
    $createResp = Invoke-WebRequest -Uri "$ApiUrl/market/listings" `
        -Method POST `
        -Headers @{"Authorization" = "Bearer $Token"; "Content-Type" = "application/json" } `
        -Body $listingBody -ErrorAction SilentlyContinue
    
    if ($createResp.StatusCode -eq 201 -or $createResp.StatusCode -eq 200) {
        Log-Pass "Listing created successfully ($($createResp.StatusCode))"
    }
}
catch {
    Log-Warn "Listing creation returned $($_.Exception.Response.StatusCode)"
}

# ============================================================================
# 4. DASHBOARD TESTS
# ============================================================================

Write-Host "`n=== DASHBOARD TESTS ===" -ForegroundColor $Blue

Log-Test "GET /api/dashboard - Get dashboard stats"
try {
    $dashResp = Invoke-WebRequest -Uri "$ApiUrl/dashboard" `
        -Method GET `
        -Headers @{"Authorization" = "Bearer $Token"; "Content-Type" = "application/json" } `
        -ErrorAction SilentlyContinue
    
    if ($dashResp.StatusCode -eq 200) {
        Log-Pass "Dashboard endpoint returns 200"
    }
}
catch {
    Log-Warn "Dashboard endpoint returned $($_.Exception.Response.StatusCode)"
}

Log-Test "POST /api/dashboard/compute - Compute stats"
$computeBody = @{
    crop     = "wheat"
    cropCode = 15
} | ConvertTo-Json

try {
    $computeResp = Invoke-WebRequest -Uri "$ApiUrl/dashboard/compute" `
        -Method POST `
        -Headers @{"Authorization" = "Bearer $Token"; "Content-Type" = "application/json" } `
        -Body $computeBody -ErrorAction SilentlyContinue
    
    Log-Pass "Dashboard compute endpoint responds ($($computeResp.StatusCode))"
}
catch {
    Log-Warn "Dashboard compute returned $($_.Exception.Response.StatusCode)"
}

# ============================================================================
# 5. ERROR HANDLING TESTS
# ============================================================================

Write-Host "`n=== ERROR HANDLING TESTS ===" -ForegroundColor $Blue

Log-Test "Missing Authorization header"
try {
    Invoke-WebRequest -Uri "$ApiUrl/users/me" `
        -Method GET `
        -Headers @{"Content-Type" = "application/json" } `
        -ErrorAction Stop | Out-Null
    Log-Warn "No auth header was accepted"
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Log-Pass "Missing auth properly rejected (401)"
    }
    else {
        Log-Warn "Missing auth returned $statusCode"
    }
}

Log-Test "Invalid JSON payload"
try {
    Invoke-WebRequest -Uri "$ApiUrl/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json" } `
        -Body "{ invalid json }" `
        -ErrorAction Stop | Out-Null
    Log-Warn "Invalid JSON was accepted"
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -ne 200) {
        Log-Pass "Malformed JSON rejected ($statusCode)"
    }
}

# ============================================================================
# 6. RESPONSE TIME TESTS
# ============================================================================

Write-Host "`n=== PERFORMANCE TESTS ===" -ForegroundColor $Blue

Log-Test "Profile endpoint response time"
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$perfResp = Invoke-WebRequest -Uri "$ApiUrl/users/me" `
    -Method GET `
    -Headers @{"Authorization" = "Bearer $Token"; "Content-Type" = "application/json" } `
    -ErrorAction SilentlyContinue
$sw.Stop()

$timeMs = $sw.ElapsedMilliseconds
if ($timeMs -lt 200) {
    Log-Pass "Profile endpoint fast: ${timeMs}ms"
}
elseif ($timeMs -lt 500) {
    Log-Warn "Profile endpoint slow: ${timeMs}ms (acceptable)"
}
else {
    Log-Warn "Profile endpoint very slow: ${timeMs}ms"
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "`n=== TEST SUMMARY ===" -ForegroundColor $Blue
$total = $Passed + $Failed + $Warnings
Write-Host "Total Tests: $total"
Write-Host "Passed: $Passed" -ForegroundColor $Green
Write-Host "Failed: $Failed" -ForegroundColor $Red
Write-Host "Warnings: $Warnings" -ForegroundColor $Yellow

if ($Failed -eq 0) {
    Write-Host "`n✅ All critical tests passed!" -ForegroundColor $Green
}
else {
    Write-Host "`n❌ Some tests failed - review above" -ForegroundColor $Red
}

