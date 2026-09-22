package com.midinero.personal;

import android.annotation.SuppressLint;
import android.webkit.JavascriptInterface;
import android.util.Base64;
import java.io.ByteArrayInputStream;
import java.io.OutputStream;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

public class MainActivity extends AppCompatActivity {
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final int BACKUP_CREATE_REQUEST = 1002;
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private byte[] pendingBackup;
    private String pendingBackupName;

    @SuppressLint("SetJavaScriptEnabled")
    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        webView = new WebView(this);
        setContentView(webView);

        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        webView.setWebViewClient(new WebViewClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!isTrustedAppUri(uri)) return new WebResourceResponse("text/plain", "UTF-8", new java.io.ByteArrayInputStream(new byte[0]));
                return loader.shouldInterceptRequest(uri);
            }

            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                return !isTrustedAppUri(uri);
            }
        });
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface public void saveBackup(String base64, String filename) {
                try {
                    pendingBackup = Base64.decode(base64, Base64.DEFAULT);
                    pendingBackupName = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
                    runOnUiThread(() -> {
                        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                        intent.addCategory(Intent.CATEGORY_OPENABLE);
                        intent.setType("application/octet-stream");
                        intent.putExtra(Intent.EXTRA_TITLE, pendingBackupName);
                        startActivityForResult(intent, BACKUP_CREATE_REQUEST);
                    });
                } catch (Exception ex) {
                    pendingBackup = null;
                    pendingBackupName = null;
                }
            }
        }, "MiDineroAndroid");
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = params.createIntent();
                try { startActivityForResult(intent, FILE_CHOOSER_REQUEST); }
                catch (Exception ex) { fileCallback = null; return false; }
                return true;
            }
        });

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setGeolocationEnabled(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        webView.clearCache(false);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack(); else finish();
            }
        });
        webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html");
    }

    private boolean isTrustedAppUri(Uri uri) {
        return uri != null
            && "https".equalsIgnoreCase(uri.getScheme())
            && "appassets.androidplatform.net".equalsIgnoreCase(uri.getHost())
            && uri.getPath() != null
            && uri.getPath().startsWith("/assets/www/");
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == BACKUP_CREATE_REQUEST) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null && pendingBackup != null) {
                try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                    if (out != null) {
                        out.write(pendingBackup);
                        android.widget.Toast.makeText(this, "Respaldo guardado correctamente", android.widget.Toast.LENGTH_LONG).show();
                    }
                } catch (Exception ex) {
                    android.widget.Toast.makeText(this, "No se pudo guardar el respaldo", android.widget.Toast.LENGTH_LONG).show();
                }
            }
            pendingBackup = null;
            pendingBackupName = null;
            return;
        }
        if (requestCode == FILE_CHOOSER_REQUEST && fileCallback != null) {
            Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            fileCallback.onReceiveValue(result);
            fileCallback = null;
        }
    }

    @Override protected void onDestroy() {
        if (webView != null) { webView.stopLoading(); webView.destroy(); }
        super.onDestroy();
    }
}
