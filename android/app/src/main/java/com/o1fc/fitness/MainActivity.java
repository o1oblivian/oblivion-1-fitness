package com.o1fc.fitness;

import android.os.Bundle;
import android.view.Window;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.ActionBar;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        supportRequestWindowFeature(Window.FEATURE_NO_TITLE);
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            actionBar.hide();
        }
        if (getActionBar() != null) {
            getActionBar().hide();
        }
    }
}
