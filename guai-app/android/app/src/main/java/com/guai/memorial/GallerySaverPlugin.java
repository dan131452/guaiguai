package com.guai.memorial;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** 安卓原生：把网络图片写进系统相册（MediaStore Pictures/妻爱吾） */
@CapacitorPlugin(
        name = "GallerySaver",
        permissions = {
                @com.getcapacitor.annotation.Permission(
                        strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE },
                        alias = "storage"
                )
        }
)
public class GallerySaverPlugin extends Plugin {

    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private PluginCall pendingCall;

    @PluginMethod
    public void saveUrl(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url 为空");
            return;
        }
        String filename = call.getString("filename", "qiaiwu-" + System.currentTimeMillis() + ".jpg");

        if (Build.VERSION.SDK_INT < 29 && !hasStorage()) {
            pendingCall = call;
            requestPermissionForAlias("storage", call, "storagePerm");
            return;
        }

        runSave(url, filename, call);
    }

    private boolean hasStorage() {
        return ContextCompat.checkSelfPermission(
                getContext(), Manifest.permission.WRITE_EXTERNAL_STORAGE
        ) == PackageManager.PERMISSION_GRANTED;
    }

    @PermissionCallback
    private void storagePerm(PluginCall call) {
        PluginCall target = (pendingCall != null) ? pendingCall : call;
        pendingCall = null;
        if (target == null) return;
        if (Build.VERSION.SDK_INT < 29 && !hasStorage()) {
            target.reject("需要存储权限才能保存到相册");
            return;
        }
        String url = target.getString("url");
        String filename = target.getString("filename", "qiaiwu-" + System.currentTimeMillis() + ".jpg");
        runSave(url, filename, target);
    }

    private void runSave(String url, String filename, PluginCall call) {
        io.execute(() -> {
            try {
                byte[] data = download(url);
                if (data == null || data.length == 0) {
                    call.reject("下载失败：空数据");
                    return;
                }
                String mime = guessMime(data, url);
                Uri uri = saveToMediaStore(data, filename, mime);
                if (uri == null) {
                    call.reject("写入相册失败");
                    return;
                }
                JSObject ret = new JSObject();
                ret.put("ok", true);
                ret.put("uri", uri.toString());
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("保存失败：" + e.getMessage(), e);
            }
        });
    }

    private static byte[] download(String urlStr) throws Exception {
        HttpURLConnection conn = null;
        try {
            URL u = new URL(urlStr);
            conn = (HttpURLConnection) u.openConnection();
            conn.setConnectTimeout(20000);
            conn.setReadTimeout(40000);
            conn.setInstanceFollowRedirects(true);
            conn.setRequestProperty("User-Agent", "QiaiwuApp");
            int code = conn.getResponseCode();
            if (code >= 400) throw new Exception("HTTP " + code);
            InputStream in = conn.getInputStream();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            in.close();
            return out.toByteArray();
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static String guessMime(byte[] data, String url) {
        try {
            BitmapFactory.Options o = new BitmapFactory.Options();
            o.inJustDecodeBounds = true;
            BitmapFactory.decodeByteArray(data, 0, data.length, o);
            if (o.outMimeType != null && !o.outMimeType.isEmpty()) return o.outMimeType;
        } catch (Exception ignored) {}
        String lower = (url == null ? "" : url).toLowerCase();
        if (lower.contains(".png")) return "image/png";
        if (lower.contains(".webp")) return "image/webp";
        return "image/jpeg";
    }

    private Uri saveToMediaStore(byte[] data, String filename, String mime) throws Exception {
        ContentResolver cr = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Images.Media.DISPLAY_NAME, filename);
        values.put(MediaStore.Images.Media.MIME_TYPE, mime);

        Uri collection;
        if (Build.VERSION.SDK_INT >= 29) {
            values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/妻爱吾");
            values.put(MediaStore.Images.Media.IS_PENDING, 1);
            collection = MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        } else {
            collection = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
        }

        Uri item = cr.insert(collection, values);
        if (item == null) return null;
        OutputStream os = cr.openOutputStream(item);
        if (os == null) {
            cr.delete(item, null, null);
            return null;
        }
        os.write(data);
        os.flush();
        os.close();

        if (Build.VERSION.SDK_INT >= 29) {
            values.clear();
            values.put(MediaStore.Images.Media.IS_PENDING, 0);
            cr.update(item, values, null, null);
        }
        return item;
    }
}
