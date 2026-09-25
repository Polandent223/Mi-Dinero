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


## Secretos requeridos en GitHub Actions

Antes de habilitar la publicación Release, configurar estos secretos del repositorio:

- `MI_DINERO_KEYSTORE_BASE64`: contenido base64 del archivo .jks.
- `MI_DINERO_KEYSTORE_PASSWORD`: contraseña del keystore.
- `MI_DINERO_KEY_ALIAS`: alias de la clave.
- `MI_DINERO_KEY_PASSWORD`: contraseña de la clave.

El workflow debe reconstruir el .jks solo dentro del runner temporal, compilar, verificar la firma y borrar el archivo temporal. No imprimir secretos ni el contenido del keystore en logs.

## Regla de actualización

Una APK instalada solo puede actualizarse directamente con otra APK firmada por la misma clave. La APK debug ya instalada sirve para validación funcional, pero la primera Release permanente será una instalación distinta si su certificado no coincide. Antes de pasar a Release, crear un respaldo cifrado desde la app para poder restaurar los datos después de instalar la versión firmada definitiva.
