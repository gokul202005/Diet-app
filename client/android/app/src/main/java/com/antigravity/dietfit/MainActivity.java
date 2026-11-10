package com.antigravity.dietfit;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.community.plugins.bluetoothle.BluetoothLe;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BluetoothLe.class);
        super.onCreate(savedInstanceState);
    }
}
