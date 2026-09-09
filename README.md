# Mi Dinero — sistema financiero personal

Aplicación personal, offline-first, para organizar ingresos, gastos, presupuesto, reserva, metas, deudas, decisiones de compra, patrimonio e inversiones.

## Estado actual

- Partes 1–6 completas y conservadas.
- Parte 7 incorpora patrimonio neto e inversiones.
- Datos guardados primero en el dispositivo mediante IndexedDB.
- PWA con funcionamiento offline y caché de archivos principales.
- Acceso local por PIN.
- Respaldo cifrado independiente.

## Parte 7 — Patrimonio e inversiones

El módulo de Patrimonio integra automáticamente la reserva de emergencia, las inversiones registradas y las deudas activas para reducir el riesgo de doble conteo. Los activos y pasivos manuales se reservan para elementos que no estén ya registrados en otros módulos.

La cartera se organiza por cuatro funciones: Crecer, Proteger, Cubrir y Estar disponible. Los valores se actualizan manualmente; la app no depende de cotizaciones en línea. El criterio de “deuda cara” no se fija automáticamente: el usuario puede indicar la tasa anual que desea usar como umbral.

## Ejecución

Para usar todas las funciones debe abrirse desde HTTPS o localhost. La versión publicada usa GitHub Pages.

## Privacidad

Mi Dinero está diseñado para un solo propietario. No incluye multiusuario ni funciones comerciales. Los datos financieros permanecen localmente salvo que el usuario exporte un respaldo.
