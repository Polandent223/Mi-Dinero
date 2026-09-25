# Firma privada de Mi Dinero Android

La clave privada de firma **nunca debe guardarse en este repositorio**.

La compilación Release usa estas variables de entorno:

- `MI_DINERO_KEYSTORE_FILE`: ruta temporal al archivo .jks.
- `MI_DINERO_KEYSTORE_PASSWORD`: contraseña del keystore.
- `MI_DINERO_KEY_ALIAS`: alias de la clave.
- `MI_DINERO_KEY_PASSWORD`: contraseña de la clave.

El archivo .jks debe reconstruirse temporalmente en CI desde un secreto privado y eliminarse al terminar. La versión Release solo debe publicarse cuando las cuatro variables estén disponibles.

Conservar una copia privada y segura del keystore y sus contraseñas. Perder esa clave impide firmar futuras actualizaciones compatibles con una instalación firmada con ella.

La APK debug actual sigue siendo únicamente la candidata validada en dispositivo. No sustituirla por una Release hasta configurar una clave persistente.
