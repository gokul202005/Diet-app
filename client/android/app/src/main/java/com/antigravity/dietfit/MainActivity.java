package com.antigravity.dietfit;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.community.plugins.bluetoothle.BluetoothLe;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BluetoothLe.class);
        super.onCreate(savedInstanceState);
        handleDeepLink(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        if (intent != null && intent.getData() != null) {
            Uri uri = intent.getData();
            if ("agyfit".equals(uri.getScheme()) || "com.antigravity.dietfit".equals(uri.getScheme())) {
                String query = uri.getQuery();
                String targetUrl = "https://diet-app-backend-udje.onrender.com/?" + (query != null ? query : "auth_success=1");
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().post(() -> getBridge().getWebView().loadUrl(targetUrl));
                } else {
                    new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                        if (getBridge() != null && getBridge().getWebView() != null) {
                            getBridge().getWebView().loadUrl(targetUrl);
                        }
                    }, 600);
                }
            }
        }
    }
}
