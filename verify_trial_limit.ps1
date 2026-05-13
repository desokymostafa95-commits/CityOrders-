# verify_trial_limit.ps1
$baseUrl = "http://localhost:5014/api"
$testEmail = "trial_limit_test_$(Get-Random)@test.com"
$password = "P@ssword123"

function Log($msg) {
    Write-Host "`n[TEST] $msg" -ForegroundColor Cyan
}

Log "1. Admin Login..."
$adminLoginBody = @{ email = "admin@cityorders.local"; password = "Admin123!" } | ConvertTo-Json
$adminRes = Invoke-RestMethod -Uri "$baseUrl/Auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
$adminToken = $adminRes.token
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

Log "2. Setting Trial Limit to 2..."
$settingsBody = @{ isFreeTrialEnabled = $true; freeTrialDays = 14; trialGraceDays = 3; trialMaxConcurrentOffers = 2 } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/admin/settings" -Method Put -Headers $adminHeaders -ContentType "application/json" -Body $settingsBody > $null

Log "3. Registering and Approving new merchant..."
$regBody = @{
    name         = "Trial Limit Merchant"
    email        = "$testEmail"
    password     = "$password"
    brandName    = "Trial Brand"
    brandAddress = "123 Trial Lane"
    brandPhone   = "0987654321"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/merchant/apply-anon" -Method Post -Body $regBody -ContentType "application/json" > $null
$userId = (Invoke-RestMethod -Uri "$baseUrl/Auth/login" -Method Post -Body (@{ email = $testEmail; password = $password } | ConvertTo-Json) -ContentType "application/json").userId
Invoke-RestMethod -Uri "$baseUrl/Admin/approve-merchant/$userId" -Method Post -Headers $adminHeaders > $null

Log "4. Logging in as merchant & Activating Trial..."
$loginRes = Invoke-RestMethod -Uri "$baseUrl/Auth/login" -Method Post -Body (@{ email = $testEmail; password = $password } | ConvertTo-Json) -ContentType "application/json"
$token = $loginRes.token
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "$baseUrl/merchant/subscription/trial/activate" -Method Post -Headers $headers > $null

Log "5. Checking limit (expecting 2)..."
$limit = Invoke-RestMethod -Uri "$baseUrl/merchant/offers/limit" -Method Get -Headers $headers
Log "Limit: $($limit.maxConcurrentOffers)"
if ($limit.maxConcurrentOffers -ne 2) { throw "Expected limit 2" }

Log "6. Creating 2 offers..."
$prodBody = @{ name = "Trial Test Product"; price = 100; unitType = "Piece"; quantityStep = 1.0; allowFractionalQuantity = $false } | ConvertTo-Json
$prodRes = Invoke-RestMethod -Uri "$baseUrl/merchant/products" -Method Post -Body $prodBody -ContentType "application/json" -Headers $headers
$prodId = $prodRes.productId

function CreateOffer($productIdParam, $price) {
    $body = @{ productId = $productIdParam; offerPrice = $price; startAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"); endAt = (Get-Date).AddDays(1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/merchant/offers" -Method Post -Body $body -ContentType "application/json" -Headers $headers
}

CreateOffer $prodId 90 > $null
CreateOffer $prodId 80 > $null
Log "Created 2 offers successfully."

Log "7. Attempting 3rd offer (should fail)..."
try {
    CreateOffer $prodId 70 > $null
    throw "Should have failed with 409 Conflict"
}
catch {
    if ($_.Exception.Response.StatusCode -eq "Conflict") {
        Log "Correctly blocked 3rd offer."
    }
    else {
        throw "Unexpected error: $($_.Exception.Message)"
    }
}

Log "8. Admin updating Trial Limit to 3..."
$settingsBody = @{ isFreeTrialEnabled = $true; freeTrialDays = 14; trialGraceDays = 3; trialMaxConcurrentOffers = 3 } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/admin/settings" -Method Put -Headers $adminHeaders -ContentType "application/json" -Body $settingsBody > $null

Log "9. Checking limit again (expecting 3)..."
$limit = Invoke-RestMethod -Uri "$baseUrl/merchant/offers/limit" -Method Get -Headers $headers
Log "New Limit: $($limit.maxConcurrentOffers)"
if ($limit.maxConcurrentOffers -ne 3) { throw "Expected limit 3" }

Log "10. Creating 3rd offer (should now succeed)..."
CreateOffer $prodId 70 > $null
Log "3rd offer created successfully after admin setting change."

Log "--- TRIAL LIMIT VERIFICATION SUCCESS ---"
