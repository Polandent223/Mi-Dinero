# Mi Dinero Android

Contenedor Android nativo para la versión estable de Mi Dinero.

La aplicación carga sus archivos web desde recursos locales mediante `WebViewAssetLoader`, evitando `file://` y conservando el modelo offline-first. No usa un servidor remoto para arrancar.

Antes de compilar, el contenido web estable debe copiarse a `android/app/src/main/assets/www/`. La rama `android-app` mantiene este trabajo separado de `main`.
