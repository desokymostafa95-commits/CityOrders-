# verify_merchant_flow.ps1
$baseUrl = "http://localhost:5014/api"
$testEmail = "auto_merchant_$(Get-Random)@test.com"
$password = "P@ssword123"

function Log($msg) {
    Write-Host "`n[TEST] $msg" -ForegroundColor Cyan
}

Log "1. Registering new merchant..."
$regBody = @{
    name = "Auto Merchant"
    email = "$testEmail"
    password = "$password"
    brandName = "Auto Brand"
    brandAddress = "456 Auto Ln"
    brandPhone = "0987654321"
} | ConvertTo-Json
$regRes = Invoke-RestMethod -Uri "$baseUrl/merchant/apply-anon" -Method Post -Body $regBody -ContentType "application/json"
Write-Host "Response: $($regRes.message)"

Log "2. Logging in as merchant..."
$loginBody = @{ email = $testEmail; password = $password } | ConvertTo-Json
$authRes = Invoke-RestMethod -Uri "$baseUrl/Auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $authRes.token
$userId = $authRes.userId
Log "Logged in as UserID $userId"

$headers = @{ Authorization = "Bearer $token" }

Log "3. Checking initial subscription status (expecting state: None)..."
$status = Invoke-RestMethod -Uri "$baseUrl/merchant/subscription/status" -Method Get -Headers $headers
Log "State: $($status.state)"
if ($status.state -ne "None") { throw "Unexpected status state" }

Log "4. Activating 14-day Free Trial..."
$trialRes = Invoke-RestMethod -Uri "$baseUrl/merchant/subscription/trial/activate" -Method Post -Headers $headers
Log "Trial Activated. End Date: $($trialRes.endDate)"
if ($trialRes.state -ne "Active") { throw "Trial activation failed" }

Log "5. Attempting to start shift (should fail as merchant is not approved yet)..."
try {
    Invoke-RestMethod -Uri "$baseUrl/merchant/invoices/shift/start" -Method Post -Headers $headers
    throw "Should have been forbidden"
} catch {
    if ($_.Exception.Response.StatusCode -eq "Forbidden") {
        Log "Correctly blocked: Forbidden (Account pending approval)"
    } else {
        throw "Unexpected error: $($_.Exception.Message)"
    }
}

Log "6. Admin Login..."
$adminLoginBody = @{ email = "admin@cityorders.local"; password = "Admin@12345" } | ConvertTo-Json
$adminToken = (Invoke-RestMethod -Uri "$baseUrl/Auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json").token
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

Log "7. Approving Merchant as Admin..."
$approveRes = Invoke-RestMethod -Uri "$baseUrl/Admin/approve-merchant/$userId" -Method Post -Headers $adminHeaders
Log "Response: $($approveRes.message)"

Log "8. Starting Shift as Merchant..."
$shiftRes = Invoke-RestMethod -Uri "$baseUrl/merchant/invoices/shift/start" -Method Post -Headers $headers
Log "Shift Started. ID: $($shiftRes.shiftId)"

Log "9. Verifying visibility in Public Catalog..."
$catalog = Invoke-RestMethod -Uri "$baseUrl/Catalog/brands" -Method Get
$isFound = $catalog.items | Where-Object { $_.name -eq "Auto Brand" }
if ($isFound) {
    Log "SUCCESS: Auto Brand is visible in catalog."
} else {
    throw "FAILED: Auto Brand not found in catalog."
}

Log "10. Closing Shift..."
$closeRes = Invoke-RestMethod -Uri "$baseUrl/merchant/invoices/shift/close" -Method Post -Headers $headers
Log "Shift Closed. Invoice: $($closeRes.invoiceNumber)"

Log "11. Verifying invisibility in Public Catalog after closure..."
$catalogAfter = Invoke-RestMethod -Uri "$baseUrl/Catalog/brands" -Method Get
$isFoundAfter = $catalogAfter.items | Where-Object { $_.name -eq "Auto Brand" }
if (-not $isFoundAfter) {
    Log "SUCCESS: Auto Brand is now hidden from catalog."
} else {
    throw "FAILED: Auto Brand is still visible after shift closure."
}

Log "--- ALL AUTOMATED AGENT TESTS PASSED ---"
