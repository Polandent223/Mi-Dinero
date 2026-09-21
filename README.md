# Mi Dinero — sistema financiero personal

Aplicación personal, offline-first, para organizar ingresos, gastos, presupuesto, reserva, metas, deudas, decisiones de compra, patrimonio e inversiones.

## Estado actual — Web/PWA 1.0 estable

La versión web/PWA completó las ocho etapas previstas. Funciona primero con datos locales mediante IndexedDB, puede instalarse como PWA y mantiene las funciones financieras principales disponibles sin conexión.

Incluye diagnóstico financiero, movimientos, presupuesto y fugas, reserva y metas, deudas y filtro de compras, patrimonio e inversiones, PIN local, comprobación de integridad, recuperación mediante snapshots y respaldo cifrado independiente.

Los flujos críticos están cubiertos por pruebas automáticas de navegador: configuración y bloqueo, persistencia offline, recuperación local, respaldo cifrado, diagnóstico y movimientos, presupuesto, aportes a reserva con reversión y pagos de deuda con reversión. GitHub Actions también comprueba sintaxis, estructura y cálculos esenciales.

## Patrimonio e inversiones

El módulo de Patrimonio integra automáticamente la reserva de emergencia, las inversiones registradas y las deudas activas para reducir el riesgo de doble conteo. Los activos y pasivos manuales se reservan para elementos que no estén ya registrados en otros módulos.

La cartera se organiza por cuatro funciones: Crecer, Proteger, Cubrir y Estar disponible. Los valores se actualizan manualmente; la app no depende de cotizaciones en línea. El criterio de “deuda cara” no se fija automáticamente: el usuario puede indicar la tasa anual que desea usar como umbral.

## Ejecución

Para usar todas las funciones debe abrirse desde HTTPS o localhost. La versión publicada usa GitHub Pages.

## Privacidad

Mi Dinero está diseñado para un solo propietario. No incluye multiusuario ni funciones comerciales. Los datos financieros permanecen localmente salvo que el usuario exporte un respaldo.

## Próxima etapa

Con la versión web/PWA estabilizada, la siguiente etapa del proyecto es el empaquetado y adaptación para Android/APK sin sustituir ni poner en riesgo la versión web estable.
