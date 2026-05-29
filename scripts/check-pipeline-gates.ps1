$url = "https://tfgtfhwvrswjvkyeyvsp.supabase.co/rest/v1/pipeline_gates?select=product_slug,test_part_a_admin_portal,test_part_b_user_portal,test_part_c_auth_flows,test_part_d_scaffold_verify,validation_test_status,last_validation_test_run&order=product_slug"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZ3RmaHd2cnN3anZreWV5dnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTA0NDYsImV4cCI6MjA4Mjc4NjQ0Nn0.wU26UZZMO_htvh1Bsw6JfmKMUTgwKzUiRz3rXkwxxcc"

$result = Invoke-RestMethod -Uri $url -Method GET -Headers @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
}

$result | ForEach-Object { Write-Host "$($_.product_slug): A=$($_.test_part_a_admin_portal) B=$($_.test_part_b_user_portal) C=$($_.test_part_c_auth_flows) D=$($_.test_part_d_scaffold_verify) status=$($_.validation_test_status) last=$($_.last_validation_test_run)" }
