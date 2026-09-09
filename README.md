# Mi Dinero — Parte 6 v3

App financiera personal offline-first.

## Cierre de Parte 6
- Historial dedicado de pagos de deuda.
- Cada pago queda vinculado al movimiento de Obligaciones correspondiente.
- Deshacer un pago restaura el saldo de la deuda y elimina lógicamente el movimiento asociado.
- Los movimientos vinculados a pagos de deuda no se pueden editar/eliminar de forma independiente, evitando descuadres.
- El asistente de compra conserva la regla de 12 preguntas y añade contexto financiero personal: disponible real, margen tras presupuesto, estado de reserva, deudas activas y costo mensual de mantenimiento.
- El contexto no sustituye la puntuación del filtro; se muestra como una capa adicional de cautela.
- IndexedDB esquema 15 y caché PWA renovado.

Las simulaciones y evaluaciones son educativas y dependen de los datos introducidos. No sustituyen cálculos oficiales del acreedor ni asesoramiento financiero.

Ejecuta la carpeta mediante HTTP/HTTPS para probar correctamente el modo PWA/offline.
