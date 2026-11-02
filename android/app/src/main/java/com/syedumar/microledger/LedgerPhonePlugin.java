package com.syedumar.microledger;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.speech.RecognizerIntent;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicBoolean;
import android.os.Handler;
import android.os.Looper;

@CapacitorPlugin(name = "LedgerPhone")
public class LedgerPhonePlugin extends Plugin {
    @PluginMethod
    public void recognize(PluginCall call) {
        String data = call.getString("data", "");
        if (data.isEmpty() || data.length() > 14000000) {
            call.reject("Choose a receipt photo smaller than 10 MB.");
            return;
        }
        getBridge().execute(() -> {
            try {
                byte[] bytes = Base64.decode(data, Base64.DEFAULT);
                BitmapFactory.Options bounds = new BitmapFactory.Options();
                bounds.inJustDecodeBounds = true;
                BitmapFactory.decodeByteArray(bytes, 0, bytes.length, bounds);
                if (bounds.outWidth <= 0 || bounds.outHeight <= 0 ||
                        (long) bounds.outWidth * bounds.outHeight > 20000000) {
                    call.reject("Could not open this receipt. Try a smaller photo.");
                    return;
                }
                Bitmap bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
                if (bitmap == null) { call.reject("Could not decode this photo."); return; }
                TextRecognizer reader = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
                AtomicBoolean finished = new AtomicBoolean(false);
                Handler handler = new Handler(Looper.getMainLooper());
                Runnable timeout = () -> {
                    if (finished.compareAndSet(false, true)) call.reject("Reading took too long. Try a clearer photo.");
                };
                handler.postDelayed(timeout, 30000);
                reader.process(InputImage.fromBitmap(bitmap, 0))
                    .addOnSuccessListener(result -> {
                        if (finished.compareAndSet(false, true)) {
                            JSObject value = new JSObject(); value.put("text", result.getText()); call.resolve(value);
                        }
                    })
                    .addOnFailureListener(error -> {
                        if (finished.compareAndSet(false, true)) call.reject("Could not read this receipt. Try a clearer photo.");
                    })
                    .addOnCompleteListener(result -> {
                        handler.removeCallbacks(timeout); reader.close(); bitmap.recycle();
                    });
            } catch (Exception error) { call.reject("Could not read this photo. Please choose another receipt."); }
        });
    }

    @PluginMethod
    public void dictate(PluginCall call) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-PK");
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "What did you spend?");
        try { startActivityForResult(call, intent, "dictationResult"); }
        catch (Exception error) { call.reject("Voice input is unavailable on this phone. Please type your note."); }
    }

    @ActivityCallback
    private void dictationResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("Voice entry cancelled. You can type your note instead."); return;
        }
        ArrayList<String> matches = result.getData().getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
        if (matches == null || matches.isEmpty()) { call.reject("No speech detected. Try again or type your note."); return; }
        JSObject value = new JSObject(); value.put("text", matches.get(0)); call.resolve(value);
    }
}
