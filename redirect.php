<?php
// URLs for redirection
$ios_url = 'https://apps.apple.com/us/app/helloblue/id6450708010?ign-itscg=30200&ign-itsct=apps_box_badge';
$android_url = 'https://play.google.com/store/apps/details?id=com.cloudtenlabs.helloblue&hl=en_US&gl=US&pli=1';
$default_url = 'http://helloblue.ai'; // Default URL for non-iOS and non-Android devices

// Detect the user's device
$user_agent = $_SERVER['HTTP_USER_AGENT'];
if (strpos($user_agent, 'iPhone') !== false || strpos($user_agent, 'iPad') !== false) {
    // Redirect to the App Store
    header('Location: ' . $ios_url);
    exit;
} elseif (strpos($user_agent, 'Android') !== false) {
    // Redirect to Google Play
    header('Location: ' . $android_url);
    exit;
} else {
    // Redirect to the default URL if the device is neither iOS nor Android
    header('Location: ' . $default_url);
    exit;
}
?>
