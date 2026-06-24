HU-06 — Registrar medios de pago en los gastos

Como usuario

Quiero seleccionar el medio de pago utilizado al registrar un gasto

Para llevar un control de cómo estoy utilizando mi dinero.

Criterios de aceptación

* Al registrar un gasto debe permitirse seleccionar:
    * Tarjeta de Crédito
    * Tarjeta de Débito
    * Efectivo
* El medio de pago debe quedar almacenado en el movimiento.
* Debe poder visualizarse posteriormente en consultas e historial.
* El sistema debe permitir filtrar gastos por medio de pago.

⸻

HU-07 — Administración de tarjetas de crédito

Como usuario

Quiero registrar mis tarjetas de crédito y sus características

Para controlar mis límites y fechas de pago.

Criterios de aceptación

* Debe permitir registrar:
    * Nombre de la tarjeta
    * Banco emisor
    * Límite de crédito
    * Fecha de corte
    * Fecha límite de pago
* Debe permitir editar la información.
* Debe permitir manejar múltiples tarjetas.
* Debe mostrar crédito disponible.

Ejemplo

BAC Cash Back

* Límite: $3,300
* Corte: 03 de cada mes
* Pago: 29 de cada mes

⸻

HU-08 — Acumulación automática de compras realizadas con tarjeta de crédito

Como usuario

Quiero que las compras pagadas con tarjeta de crédito se acumulen automáticamente

Para conocer cuánto debo pagar en mi próximo estado de cuenta.

Criterios de aceptación

* Cuando un gasto se registre con tarjeta de crédito:
    * Debe sumarse al saldo utilizado.
    * Debe descontarse del crédito disponible.
* El sistema debe mostrar:
    * Monto utilizado.
    * Crédito disponible.
    * Cantidad de compras realizadas.
* Debe reflejar los cambios inmediatamente.

Ejemplo

Límite: $3,300

Compra 1: $50

Compra 2: $100

Compra 3: $250

Total utilizado: $400

Disponible: $2,900

⸻

HU-09 — Cálculo automático del estado de cuenta por ciclo de facturación

Como usuario

Quiero que el sistema identifique automáticamente qué compras pertenecen a mi próximo pago

Para saber cuánto debo pagar según mi fecha de corte.

Criterios de aceptación

* El sistema debe tomar:
    * Fecha de corte
    * Fecha de pago
* Debe agrupar automáticamente las compras realizadas dentro del ciclo.
* Debe mostrar:
    * Total a pagar del ciclo actual.
    * Fecha límite de pago.
    * Compras incluidas en el ciclo.

Ejemplo

Fecha corte: 03 junio

Fecha pago: 29 junio

Compras realizadas entre:

04 junio - 03 julio

Pasan al siguiente pago.

⸻

HU-10 — Dashboard de tarjeta de crédito

Como usuario

Quiero visualizar un dashboard de mi tarjeta de crédito

Para controlar mi deuda y utilización.

Criterios de aceptación

El dashboard debe mostrar:

* Límite total.
* Crédito disponible.
* Crédito utilizado.
* Porcentaje de utilización.
* Próxima fecha de corte.
* Próxima fecha de pago.
* Total acumulado del ciclo.
* Historial de compras.

Indicadores visuales

* Verde: uso menor al 30%.
* Amarillo: uso entre 30% y 70%.
* Rojo: uso superior al 70%.

⸻

HU-11 — Pago de tarjeta de crédito

Como usuario

Quiero registrar los pagos realizados a mi tarjeta

Para mantener actualizado mi saldo pendiente.

Criterios de aceptación

* Debe permitir registrar:
    * Fecha del pago.
    * Monto pagado.
    * Cuenta origen.
* El sistema debe:
    * Restar el pago del saldo pendiente.
    * Liberar crédito disponible.
    * Mantener historial de pagos.

Ejemplo

Saldo utilizado: $400

Pago realizado: $250

Nuevo saldo pendiente: $150

Crédito disponible: $3,150

⸻

HU-12 — Relación entre metas, gastos y tarjeta de crédito

Como usuario

Quiero que las compras de elementos de mis metas indiquen el medio de pago utilizado

Para conocer si los gastos fueron cubiertos con ahorro, efectivo o tarjeta.

Criterios de aceptación

* Al marcar un elemento como comprado:
    * Debe solicitar medio de pago.
* Si se selecciona tarjeta de crédito:
    * Debe actualizar la deuda de la tarjeta.
* Si se selecciona efectivo o débito:
    * Solo debe registrarse el gasto.
* El dashboard de la meta debe reflejar el gasto independientemente del medio de pago.

HU-13 — Capacidad de pago de tarjeta de crédito

Como usuario

Quiero conocer si tengo suficiente dinero para pagar mi tarjeta de crédito

Para tomar decisiones financieras informadas antes de la fecha de pago.

Criterios de aceptación

* El sistema debe calcular:
    * Saldo pendiente de la tarjeta.
    * Dinero disponible en carteras.
    * Dinero comprometido en metas.
    * Dinero libre disponible.
* Debe mostrar:
    * Monto pendiente.
    * Capacidad de pago.
    * Porcentaje cubierto.
* Debe indicar visualmente:
    * ✅ Pago cubierto.
    * ⚠️ Pago parcial.
    * ❌ Fondos insuficientes.

⸻

HU-14 — Pago de tarjeta desde una cartera

Como usuario

Quiero registrar el pago de mi tarjeta utilizando una de mis carteras

Para reflejar correctamente la salida de dinero.

Criterios de aceptación

* Debe permitir seleccionar:
    * NIU
    * BAC Cuenta
    * MultiMoney
    * Efectivo
* Debe descontar el monto de la cartera seleccionada.
* Debe disminuir el saldo pendiente de la tarjeta.
* Debe generar un movimiento financiero.

⸻

HU-15 — Simulación de pago de tarjeta

Como usuario

Quiero simular pagos futuros de mi tarjeta

Para saber cómo afectarán mis ahorros y metas.

Criterios de aceptación

* Debe mostrar:
    * Saldo actual.
    * Pago simulado.
    * Saldo restante.
* Debe indicar el impacto en:
    * Carteras.
    * Metas de ahorro.
* No debe afectar datos reales.

⸻

HU-16 — Dinero comprometido vs dinero disponible

Como usuario

Quiero distinguir entre dinero ahorrado para metas y dinero libre

Para evitar utilizar fondos destinados a objetivos específicos.

Ejemplo

NIU: $3,000

Meta Argentina: $1,500

Meta Casa: $1,000

Dinero comprometido: $2,500

Dinero libre: $500

Criterios de aceptación

* El sistema debe calcular automáticamente:
    * Dinero total.
    * Dinero comprometido.
    * Dinero libre.
* Debe mostrarse en Dashboard General.