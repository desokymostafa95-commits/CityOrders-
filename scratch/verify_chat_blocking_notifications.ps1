# verify_chat_blocking_notifications.ps1
$baseUrl = "http://localhost:5014/api"
$testEmail = "chat_merchant_$(Get-Random)@test.com"
$password = "P@ssword123"

function Log($msg) {
    Write-Host "`n[TEST] $msg" -ForegroundColor Cyan
}

# 1. Register a new merchant
Log "1. Registering new merchant..."
$regBody = @{
    name = "Chat Merchant"
    email = "$testEmail"
    password = "$password"
    brandName = "Chat Brand"
    brandAddress = "789 Chat St"
    brandPhone = "1112223334"
} | ConvertTo-Json
$regRes = Invoke-RestMethod -Uri "$baseUrl/merchant/apply-anon" -Method Post -Body $regBody -ContentType "application/json"
Write-Host "Response: $($regRes.message)"

# 2. Login as Merchant
Log "2. Logging in as merchant..."
$loginBody = @{ email = $testEmail; password = $password } | ConvertTo-Json
$authRes = Invoke-RestMethod -Uri "$baseUrl/Auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$merchantToken = $authRes.token
$merchantUserId = $authRes.userId
Log "Merchant logged in with UserID $merchantUserId"
$merchantHeaders = @{ Authorization = "Bearer $merchantToken" }

# 3. Admin Login & Approve Merchant
Log "3. Logging in as Admin..."
$adminLoginBody = @{ email = "desoky@gmail.com"; password = "Desoky1!" } | ConvertTo-Json
$adminAuth = Invoke-RestMethod -Uri "$baseUrl/Auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
$adminToken = $adminAuth.token
$adminUserId = $adminAuth.userId
Log "Admin logged in with UserID $adminUserId"
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

Log "Approving merchant..."
$approveRes = Invoke-RestMethod -Uri "$baseUrl/Admin/approve-merchant/$merchantUserId" -Method Post -Headers $adminHeaders
Log "Approve response: $($approveRes.message)"

# 4. Create support chat thread from Admin to Merchant
Log "4. Creating support chat thread from Admin to Merchant..."
$threadRes = Invoke-RestMethod -Uri "$baseUrl/Chat/admin/merchants/$merchantUserId/thread" -Method Post -Headers $adminHeaders
$threadId = $threadRes.id
Log "Created thread ID: $threadId"
Write-Host "Thread Info: $($threadRes.subject) - AdminUserId: $($threadRes.adminUserId) - MerchantUserId: $($threadRes.merchantUserId)"

# 5. Send message from Merchant to Admin
Log "5. Sending message from Merchant to Admin..."
$msgBody = @{ body = "Hello support team!" } | ConvertTo-Json
$msgRes = Invoke-RestMethod -Uri "$baseUrl/Chat/threads/$threadId/messages" -Method Post -Body $msgBody -ContentType "application/json" -Headers $merchantHeaders
Log "Sent message ID: $($msgRes.id)"

# 6. Verify Admin gets notification for the message
Log "6. Verification: Admin gets notification..."
Start-Sleep -Seconds 2 # Wait for async processing
$notificationsRes = Invoke-RestMethod -Uri "$baseUrl/Notifications?unreadOnly=true" -Method Get -Headers $adminHeaders
$unreadCount = $notificationsRes.unreadCount
Log "Admin unread count: $unreadCount"
$matchingNotif = $notificationsRes.items | Where-Object { $_.type -eq "ChatMessage" -and $_.message -eq "Hello support team!" }
if ($matchingNotif) {
    Log "SUCCESS: Found unread notification for the message!"
} else {
    throw "FAILED: Unread notification not found."
}

# 7. Block the thread from Merchant
Log "7. Blocking thread from Merchant..."
$blockRes = Invoke-RestMethod -Uri "$baseUrl/Chat/threads/$threadId/block" -Method Post -Headers $merchantHeaders
Log "Blocked successfully."

# 8. Check that thread is indeed blocked (by querying details)
Log "8. Querying thread details to verify blocked flags..."
$threadDetail = Invoke-RestMethod -Uri "$baseUrl/Chat/threads/$threadId" -Method Get -Headers $merchantHeaders
Log "IsBlockedByMerchant: $($threadDetail.thread.isBlockedByMerchant)"
Log "IsBlockedByCustomer: $($threadDetail.thread.isBlockedByCustomer)"
if ($threadDetail.thread.isBlockedByMerchant -ne $true) {
    throw "FAILED: Thread should be blocked by Merchant"
}
if ($threadDetail.thread.isBlockedByCustomer -eq $true) {
    throw "FAILED: Thread should NOT be blocked by Customer (role overlap check failed!)"
}
Log "SUCCESS: Role overlap validation passed! Only Merchant status is true."

# 9. Try sending a message while blocked (expecting 400 Bad Request)
Log "9. Try sending message while blocked (expecting BadRequest)..."
try {
    $failMsg = @{ body = "This should fail!" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/Chat/threads/$threadId/messages" -Method Post -Body $failMsg -ContentType "application/json" -Headers $merchantHeaders
    throw "FAILED: Message sending did not fail when thread is blocked."
} catch [System.Net.WebException] {
    $statusCode = [int]$_.Exception.Response.StatusCode
    Log "Received expected error response with status code: $statusCode"
    if ($statusCode -eq 400) {
        Log "SUCCESS: Blocked message correctly returned 400 BadRequest!"
    } else {
        throw "FAILED: Error status mismatch. Expected 400, got $statusCode"
    }
}

# 10. Unblock the thread
Log "10. Unblocking thread..."
$unblockRes = Invoke-RestMethod -Uri "$baseUrl/Chat/threads/$threadId/unblock" -Method Post -Headers $merchantHeaders
Log "Unblocked successfully."

# 11. Send message after unblocking
Log "11. Sending message after unblocking..."
$successMsg = @{ body = "I am back!" } | ConvertTo-Json
$msgRes2 = Invoke-RestMethod -Uri "$baseUrl/Chat/threads/$threadId/messages" -Method Post -Body $successMsg -ContentType "application/json" -Headers $merchantHeaders
Log "Sent message ID after unblock: $($msgRes2.id)"

Log "--- ALL CHAT BLOCKING & NOTIFICATION TESTS PASSED ---"
