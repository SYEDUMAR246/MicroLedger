package com.syedumar.microledger;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LedgerPhonePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
