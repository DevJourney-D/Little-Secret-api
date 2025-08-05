# PowerShell script to test new availability check endpoints
$baseUrl = "https://little-secret-api.vercel.app/api"

Write-Host "🔍 Testing Username and Email Availability Check Endpoints" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -ContentType "application/json"
    Write-Host "✅ Health Check Success" -ForegroundColor Green
    Write-Host "   API Status: $($healthResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Check Username Availability (Available)
Write-Host "`n2. Testing Username Availability Check (Available)..." -ForegroundColor Yellow
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$availableUsername = "available$timestamp"

try {
    $usernameCheckResponse = Invoke-RestMethod -Uri "$baseUrl/check/username/$availableUsername" -Method GET -ContentType "application/json"
    Write-Host "✅ Username Check Success" -ForegroundColor Green
    Write-Host "   Username: $availableUsername" -ForegroundColor Cyan
    Write-Host "   Available: $($usernameCheckResponse.available)" -ForegroundColor Cyan
    Write-Host "   Message: $($usernameCheckResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Username Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
    }
}

# Test 3: Check Email Availability (Available)
Write-Host "`n3. Testing Email Availability Check (Available)..." -ForegroundColor Yellow
$availableEmail = "available$timestamp@example.com"

try {
    $emailCheckResponse = Invoke-RestMethod -Uri "$baseUrl/check/email/$([uri]::EscapeDataString($availableEmail))" -Method GET -ContentType "application/json"
    Write-Host "✅ Email Check Success" -ForegroundColor Green
    Write-Host "   Email: $availableEmail" -ForegroundColor Cyan
    Write-Host "   Available: $($emailCheckResponse.available)" -ForegroundColor Cyan
    Write-Host "   Message: $($emailCheckResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Email Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
    }
}

# Test 4: Register a User First
Write-Host "`n4. Creating Test User..." -ForegroundColor Yellow
$testUser = @{
    username = "testuser$timestamp"
    email = "test$timestamp@example.com"
    password = "Password123!"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST -ContentType "application/json" -Body $testUser
    Write-Host "✅ User Registration Success" -ForegroundColor Green
    Write-Host "   Username: testuser$timestamp" -ForegroundColor Cyan
    
    $createdUsername = "testuser$timestamp"
    $createdEmail = "test$timestamp@example.com"
} catch {
    Write-Host "⚠️ User Registration Failed (might already exist): $($_.Exception.Message)" -ForegroundColor Yellow
    # Still continue with the username/email from the attempt
    $createdUsername = "testuser$timestamp"
    $createdEmail = "test$timestamp@example.com"
}

# Test 5: Check Username Availability (Should be Unavailable)
Write-Host "`n5. Testing Username Availability Check (Should be Unavailable)..." -ForegroundColor Yellow

try {
    $usernameUnavailableResponse = Invoke-RestMethod -Uri "$baseUrl/check/username/$createdUsername" -Method GET -ContentType "application/json"
    Write-Host "✅ Username Check Success" -ForegroundColor Green
    Write-Host "   Username: $createdUsername" -ForegroundColor Cyan
    Write-Host "   Available: $($usernameUnavailableResponse.available)" -ForegroundColor Cyan
    Write-Host "   Message: $($usernameUnavailableResponse.message)" -ForegroundColor Cyan
    
    if (-not $usernameUnavailableResponse.available) {
        Write-Host "   ✅ Correctly shows as unavailable!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Should show as unavailable but shows as available" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Username Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Check Email Availability (Should be Unavailable)
Write-Host "`n6. Testing Email Availability Check (Should be Unavailable)..." -ForegroundColor Yellow

try {
    $emailUnavailableResponse = Invoke-RestMethod -Uri "$baseUrl/check/email/$([uri]::EscapeDataString($createdEmail))" -Method GET -ContentType "application/json"
    Write-Host "✅ Email Check Success" -ForegroundColor Green
    Write-Host "   Email: $createdEmail" -ForegroundColor Cyan
    Write-Host "   Available: $($emailUnavailableResponse.available)" -ForegroundColor Cyan
    Write-Host "   Message: $($emailUnavailableResponse.message)" -ForegroundColor Cyan
    
    if (-not $emailUnavailableResponse.available) {
        Write-Host "   ✅ Correctly shows as unavailable!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Should show as unavailable but shows as available" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Email Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Test Invalid Username Format
Write-Host "`n7. Testing Invalid Username Format..." -ForegroundColor Yellow

try {
    $invalidUsernameResponse = Invoke-RestMethod -Uri "$baseUrl/check/username/ab" -Method GET -ContentType "application/json"
    Write-Host "✅ Invalid Username Check Success" -ForegroundColor Green
    Write-Host "   Username: ab (too short)" -ForegroundColor Cyan
    Write-Host "   Available: $($invalidUsernameResponse.available)" -ForegroundColor Cyan
    Write-Host "   Message: $($invalidUsernameResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "✅ Invalid Username Correctly Rejected" -ForegroundColor Green
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status Code: $statusCode" -ForegroundColor Cyan
    }
}

# Test 8: Test Invalid Email Format
Write-Host "`n8. Testing Invalid Email Format..." -ForegroundColor Yellow

try {
    $invalidEmailResponse = Invoke-RestMethod -Uri "$baseUrl/check/email/invalid-email" -Method GET -ContentType "application/json"
    Write-Host "✅ Invalid Email Check Success" -ForegroundColor Green
    Write-Host "   Email: invalid-email" -ForegroundColor Cyan
    Write-Host "   Available: $($invalidEmailResponse.available)" -ForegroundColor Cyan
    Write-Host "   Message: $($invalidEmailResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "✅ Invalid Email Correctly Rejected" -ForegroundColor Green
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status Code: $statusCode" -ForegroundColor Cyan
    }
}

Write-Host "`n=============================================================" -ForegroundColor Green
Write-Host "🏁 Availability Check Testing Complete!" -ForegroundColor Green

Write-Host "`n📋 New Endpoints Added:" -ForegroundColor Yellow
Write-Host "   GET /api/check/username/{username} - Check username availability" -ForegroundColor Cyan
Write-Host "   GET /api/check/email/{email} - Check email availability" -ForegroundColor Cyan
