// ========== CONFIGURACIÓN ==========
const BASE_HORARIOS = {
    'Lunes':     { e1: '09:00', s1: '13:30', e2: '15:00', s2: '19:00', base: 8.5 },
    'Martes':    { e1: '09:30', s1: '13:30', e2: '15:00', s2: '18:30', base: 7.5 },
    'Miércoles': { e1: '09:30', s1: '13:30', e2: '15:00', s2: '18:30', base: 7.5 },
    'Jueves':    { e1: '09:30', s1: '13:30', e2: '15:00', s2: '19:00', base: 8.0 },
    'Viernes':   { e1: '09:30', s1: '13:30', e2: '15:00', s2: '19:00', base: 8.0 },
    'Sábado':    { e1: '10:00', s1: '12:30', e2: '12:30', s2: '12:30', base: 2.5 },
    'Domingo':   { e1: '',     s1: '',      e2: '',      s2: '',      base: 0.0 }
};

const SABADO_ENTRADA = '10:00';
const HORA_SALIDA2_BASE = '19:00';
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MESES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

// ========== ESTADO ==========
let registros = [];
let mesSeleccionado = 0;
let añoSeleccionado = 2026;
let FERIADOS = {};

// ========== CACHE DE DOM ==========
const $ = id => document.getElementById(id);

const els = {
    fecha: $('fecha'),
    horaFinal: $('horaFinal'),
    corrido: $('corrido'),
    motivo: $('motivo'),
    esFeriado: $('esFeriado'),
    horarioTexto: $('horarioTexto'),
    prevTotal: $('prevTotal'),
    prevNormales: $('prevNormales'),
    prevExtras: $('prevExtras'),
    tablaBody: $('tablaBody'),
    sumTotal: $('sumTotal'),
    sumNormales: $('sumNormales'),
    sumExtras: $('sumExtras'),
    totalDias: $('totalDias'),
    resumenPeriodo: $('resumenPeriodo'),
    resumenSemana: $('resumenSemana'),
    totalRegistrosLabel: $('totalRegistrosLabel'),
    periodoLabel: $('periodoLabel'),
    periodoBadge: $('periodoBadge'),
    periodoSelectLabel: $('periodoSelectLabel'),
    filtroPeriodoLabel: $('filtroPeriodoLabel'),
    diaSemana: $('diaSemana'),
    selectorMes: $('selectorMes'),
    btnGuardar: $('btnGuardar'),
    btnLimpiarForm: $('btnLimpiarForm'),
    btnBorrarTodo: $('btnBorrarTodo'),
    btnExportarExcel: $('btnExportarExcel'),
    campoHoraFinal: $('campoHoraFinal'),
    camposManuales: $('camposManuales'),
    camposFeriado: $('camposFeriado'),
    sabadoFijo: $('sabadoFijo'),
    horaEntradaManual: $('horaEntradaManual'),
    horaSalidaManual: $('horaSalidaManual'),
    feriadoEntrada3: $('feriadoEntrada3'),
    feriadoSalida3: $('feriadoSalida3'),
    sabadoSalida: $('sabadoSalida'),
    rowCorrido: $('rowCorrido')
};

// ========== SISTEMA DE TOAST MEJORADO ==========
const Toast = {
    container: null,
    toasts: [],

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 3000) {
        this.init();

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const titles = {
            success: 'Éxito',
            error: 'Error',
            warning: 'Atención',
            info: 'Información'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="Toast.dismiss(this.parentElement)">×</button>
            <div class="toast-progress"></div>
        `;

        this.container.appendChild(toast);

        // Animación de entrada
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Barra de progreso
        const progress = toast.querySelector('.toast-progress');
        progress.style.width = '100%';
        requestAnimationFrame(() => {
            progress.style.transition = `width ${duration}ms linear`;
            progress.style.width = '0%';
        });

        // Auto-cerrar
        const timeout = setTimeout(() => {
            this.dismiss(toast);
        }, duration);

        toast._timeout = timeout;
        this.toasts.push(toast);

        // Limitar a 4 toasts visibles
        if (this.toasts.length > 4) {
            this.dismiss(this.toasts[0]);
        }

        return toast;
    },

    dismiss(toast) {
        if (!toast || toast._dismissing) return;
        toast._dismissing = true;

        clearTimeout(toast._timeout);
        toast.classList.remove('show');
        toast.classList.add('hide');

        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 400);
    },

    success(message, duration) { return this.show(message, 'success', duration); },
    error(message, duration) { return this.show(message, 'error', duration); },
    warning(message, duration) { return this.show(message, 'warning', duration); },
    info(message, duration) { return this.show(message, 'info', duration); }
};

// ========== FERIADOS DINÁMICOS ==========
function calcularPascua(año) {
    const a = año % 19;
    const b = Math.floor(año / 100);
    const c = año % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(año, mes, dia);
}

function getFeriados(año) {
    const pascua = calcularPascua(año);
    const viernesSanto = new Date(pascua); viernesSanto.setDate(pascua.getDate() - 2);
    const sabadoSanto = new Date(pascua); sabadoSanto.setDate(pascua.getDate() - 1);
    const fmt = d => `${año}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

    return {
        [`${año}-01-01`]: 'Año Nuevo',
        [fmt(viernesSanto)]: 'Viernes Santo',
        [fmt(sabadoSanto)]: 'Sábado Santo',
        [`${año}-05-01`]: 'Día del Trabajo',
        [`${año}-05-21`]: 'Día de las Glorias Navales',
        [`${año}-06-29`]: 'San Pedro y San Pablo',
        [`${año}-07-16`]: 'Día de la Virgen del Carmen',
        [`${año}-08-15`]: 'Asunción de la Virgen',
        [`${año}-09-18`]: 'Independencia Nacional',
        [`${año}-09-19`]: 'Día de las Glorias del Ejército',
        [`${año}-10-12`]: 'Día del Encuentro de Dos Mundos',
        [`${año}-10-31`]: 'Día de las Iglesias Evangélicas',
        [`${año}-11-01`]: 'Día de Todos los Santos',
        [`${año}-12-08`]: 'Inmaculada Concepción',
        [`${año}-12-25`]: 'Navidad'
    };
}

// ========== UTILIDADES DE FECHA ==========
function timeToMin(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function minToHrs(m) { return m / 60; }

function getDiaSemanaReal(fechaStr) {
    if (!fechaStr) return '—';
    const d = new Date(fechaStr + 'T00:00:00');
    return ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][d.getDay()];
}

function esDomingo(fechaStr) { return getDiaSemanaReal(fechaStr) === 'Domingo'; }
function esSabado(fechaStr) { return getDiaSemanaReal(fechaStr) === 'Sábado'; }

function esFeriadoReal(fechaStr) {
    if (!fechaStr) return false;
    const año = obtenerAnioDesdeFecha(fechaStr);
    if (año) {
        const feriadosAño = getFeriados(año);
        if (feriadosAño[fechaStr] !== undefined) return true;
    }
    return FERIADOS[fechaStr] !== undefined;
}

function obtenerDiaDesdeFecha(fechaStr) {
    return fechaStr ? new Date(fechaStr + 'T00:00:00').getDate() : 16;
}

function obtenerMesDesdeFecha(fechaStr) {
    return fechaStr ? new Date(fechaStr + 'T00:00:00').getMonth() : 2;
}

function obtenerAnioDesdeFecha(fechaStr) {
    return fechaStr ? new Date(fechaStr + 'T00:00:00').getFullYear() : 2026;
}

function getHorarioBase(diaNombre) {
    return BASE_HORARIOS[diaNombre] || BASE_HORARIOS['Lunes'];
}

// ========== PERÍODO ==========
function getPeriodoInfo(mesFin, año) {
    const mesInicio = mesFin - 1 < 0 ? 11 : mesFin - 1;
    const añoInicio = mesFin - 1 < 0 ? año - 1 : año;
    return {
        mesInicio, mesFin, añoInicio, añoFin: año,
        label: `16/${MESES_CORTO[mesInicio]} → 16/${MESES_CORTO[mesFin]}`,
        nombreArchivo: `${MESES_CORTO[mesInicio]}_${añoInicio}_a_${MESES_CORTO[mesFin]}_${año}`
    };
}

function getFechaInicioPeriodo(mesFin, año) {
    const mesInicio = mesFin - 1 < 0 ? 11 : mesFin - 1;
    const añoInicio = mesFin - 1 < 0 ? año - 1 : año;
    return new Date(añoInicio, mesInicio, 16);
}

function getFechaFinPeriodo(mesFin, año) {
    return new Date(año, mesFin, 16);
}

function estaEnPeriodo(fechaStr, mesFin, año) {
    if (!fechaStr) return false;
    const d = new Date(fechaStr + 'T00:00:00');
    return d >= getFechaInicioPeriodo(mesFin, año) && d <= getFechaFinPeriodo(mesFin, año);
}

function getRegistrosFiltrados() {
    return registros.filter(r => estaEnPeriodo(r.fecha, mesSeleccionado, añoSeleccionado));
}

function getDiasDelPeriodo() {
    const inicio = getFechaInicioPeriodo(mesSeleccionado, añoSeleccionado);
    const fin = getFechaFinPeriodo(mesSeleccionado, añoSeleccionado);
    const dias = [];
    const current = new Date(inicio);
    while (current <= fin) {
        dias.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dias;
}

function getSemana(diaNum, mes, año) {
    const fecha = new Date(año, mes, diaNum);
    const inicioPeriodo = getFechaInicioPeriodo(mesSeleccionado, añoSeleccionado);
    const diffDias = Math.floor((fecha.getTime() - inicioPeriodo.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(diffDias / 7) + 1;
}

// ========== CÁLCULO DE HORAS ==========
function calcularHoras(fechaStr, esCorrido, horaFinalStr, esFeriadoFlag, entradaManual, salidaManual, salidaSabado, feriadoEntrada3Val, feriadoSalida3Val) {
    if (!fechaStr) {
        return { e1: '09:30', s1: '13:30', e2: '15:00', s2: '19:00', total: 8, normales: 8, extras: 0,
            esCorrido: false, esManual: false, extrasFeriado: 0 };
    }

    const diaNombre = getDiaSemanaReal(fechaStr);
    const esDom = diaNombre === 'Domingo';
    const esSab = diaNombre === 'Sábado';

    // DOMINGO: manual
    if (esDom) {
        const entrada = entradaManual || '';
        const salida = salidaManual || '';
        if (!entrada || !salida) {
            return { e1: '', s1: '', e2: '', s2: '', total: 0, normales: 0, extras: 0,
                esCorrido: true, esManual: true, extrasFeriado: 0 };
        }
        const totalMin = timeToMin(salida) - timeToMin(entrada);
        const total = totalMin > 0 ? minToHrs(totalMin) : 0;
        return { e1: entrada, s1: salida, e2: salida, s2: salida, total, normales: 0, extras: total,
            esCorrido: true, esManual: true, extrasFeriado: 0 };
    }

    // SÁBADO: entrada fija, salida modificable
    if (esSab) {
        const entrada = SABADO_ENTRADA;
        const salida = salidaSabado || '12:30';
        const totalMin = timeToMin(salida) - timeToMin(entrada);
        const total = totalMin > 0 ? minToHrs(totalMin) : 0;
        const base = BASE_HORARIOS['Sábado'].base;
        const extras = total > base ? total - base : 0;
        const normales = total - extras;
        return { e1: entrada, s1: salida, e2: '', s2: '', total, normales, extras,
            esCorrido: true, esManual: false, extrasFeriado: 0 };
    }

    // LUNES A VIERNES
    const base = getHorarioBase(diaNombre);
    const final = horaFinalStr || HORA_SALIDA2_BASE;

    let e1, s1, e2, s2;
    if (esCorrido) {
        e1 = base.e1; s1 = base.s1; e2 = base.s1; s2 = final;
    } else {
        e1 = base.e1; s1 = base.s1; e2 = base.e2; s2 = final;
    }

    const b1 = timeToMin(s1) - timeToMin(e1);
    const b2 = timeToMin(s2) - timeToMin(e2);
    let totalMin = b1 + b2;
    if (totalMin < 0) totalMin = 0;
    const total = minToHrs(totalMin);

    const baseMin = base.base * 60;
    const extraMin = totalMin > baseMin ? totalMin - baseMin : 0;
    let extras = minToHrs(extraMin);
    let normales = total - extras;

    // FERIADO: sumar horas de ENT.3 / SAL.3 como extras adicionales
    let extrasFeriado = 0;
    if (esFeriadoFlag && feriadoEntrada3Val && feriadoSalida3Val) {
        const e3 = timeToMin(feriadoEntrada3Val);
        const s3 = timeToMin(feriadoSalida3Val);
        const feriadoMin = s3 - e3;
        if (feriadoMin > 0) {
            extrasFeriado = minToHrs(feriadoMin);
            extras += extrasFeriado;
        }
    }

    return { e1, s1, e2, s2, total, normales, extras, esCorrido, esManual: false, extrasFeriado };
}

// ========== UI: PREVIEW ==========
function actualizarPreview() {
    const fechaStr = els.fecha.value;
    const esDom = esDomingo(fechaStr);
    const esSab = esSabado(fechaStr);
    const diaNombre = getDiaSemanaReal(fechaStr);
    const esFer = els.esFeriado.checked || esFeriadoReal(fechaStr);

    // Mostrar/ocultar campos según tipo de día
    if (esDom) {
        els.camposManuales.classList.remove('oculto');
        els.camposFeriado.classList.add('oculto');
        els.sabadoFijo.classList.add('oculto');
        els.campoHoraFinal.classList.add('oculto');
        els.rowCorrido.classList.add('oculto');
    } else if (esSab) {
        els.camposManuales.classList.add('oculto');
        els.camposFeriado.classList.add('oculto');
        els.sabadoFijo.classList.remove('oculto');
        els.campoHoraFinal.classList.add('oculto');
        els.rowCorrido.classList.add('oculto');
    } else if (esFer) {
        els.camposManuales.classList.add('oculto');
        els.camposFeriado.classList.remove('oculto');
        els.sabadoFijo.classList.add('oculto');
        els.campoHoraFinal.classList.remove('oculto');
        els.rowCorrido.classList.remove('oculto');
    } else {
        els.camposManuales.classList.add('oculto');
        els.camposFeriado.classList.add('oculto');
        els.sabadoFijo.classList.add('oculto');
        els.campoHoraFinal.classList.remove('oculto');
        els.rowCorrido.classList.remove('oculto');
    }

    const h = calcularHoras(
        fechaStr,
        els.corrido.checked,
        els.horaFinal.value,
        els.esFeriado.checked,
        els.horaEntradaManual.value,
        els.horaSalidaManual.value,
        els.sabadoSalida.value,
        els.feriadoEntrada3.value,
        els.feriadoSalida3.value
    );

    // Actualizar texto de horario
    if (esDom) {
        els.horarioTexto.textContent = (h.e1 && h.s1) ? `${h.e1} → ${h.s1} (domingo - manual)` : 'Domingo (sin registrar)';
    } else if (esSab) {
        els.horarioTexto.textContent = `${h.e1} → ${h.s1} (sábado)`;
    } else if (h.esCorrido) {
        const base = getHorarioBase(diaNombre);
        els.horarioTexto.textContent = `${base.e1} → ${base.s1} · ${base.s1} → ${h.s2} (corrido)`;
    } else {
        const base = getHorarioBase(diaNombre);
        els.horarioTexto.textContent = `${base.e1} → ${base.s1} · ${base.e2} → ${h.s2}`;
    }

    // Actualizar preview de totales
    els.prevTotal.textContent = h.total.toFixed(1);
    els.prevNormales.textContent = h.normales.toFixed(1);
    if (h.extrasFeriado > 0) {
        els.prevExtras.textContent = `${h.extras.toFixed(1)} (incluye ${h.extrasFeriado.toFixed(1)} fer)`;
    } else {
        els.prevExtras.textContent = h.extras.toFixed(1);
    }

    // Actualizar badge de día
    els.diaSemana.textContent = fechaStr ? (diaNombre + (esFer ? ' 🔴' : '')) : '—';
}

// ========== GUARDAR / ELIMINAR ==========
function guardarDia() {
    if (!els.fecha.value) {
        Toast.error('Selecciona una fecha');
        return;
    }

    const diaNum = obtenerDiaDesdeFecha(els.fecha.value);
    const mes = obtenerMesDesdeFecha(els.fecha.value);
    const año = obtenerAnioDesdeFecha(els.fecha.value);

    const h = calcularHoras(
        els.fecha.value,
        els.corrido.checked,
        els.horaFinal.value,
        els.esFeriado.checked,
        els.horaEntradaManual.value,
        els.horaSalidaManual.value,
        els.sabadoSalida.value,
        els.feriadoEntrada3.value,
        els.feriadoSalida3.value
    );

    const esDom = esDomingo(els.fecha.value);
    const esFerGuardar = els.esFeriado.checked || esFeriadoReal(els.fecha.value);

    const registro = {
        dia: diaNum, fecha: els.fecha.value, mes, año,
        semana: getSemana(diaNum, mes, año),
        e1: h.e1 || '', s1: h.s1 || '', e2: h.e2 || '', s2: h.s2 || '',
        total: h.total, normales: h.normales, extras: h.extras,
        esCorrido: h.esCorrido || false, esManual: h.esManual || false,
        esDomingo: esDom, esSabado: esSabado(els.fecha.value), esFeriado: esFerGuardar,
        motivo: els.motivo.value.trim() || '',
        horaFinal: els.horaFinal.value,
        entradaManual: els.horaEntradaManual.value,
        salidaManual: els.horaSalidaManual.value,
        feriadoEntrada3: (esFerGuardar && !esDom) ? els.feriadoEntrada3.value : '',
        feriadoSalida3: (esFerGuardar && !esDom) ? els.feriadoSalida3.value : '',
        sabadoSalida: els.sabadoSalida.value
    };

    const idx = registros.findIndex(r => r.dia === diaNum && r.mes === mes && r.año === año);

    if (idx !== -1) {
        registros[idx] = registro;
        Toast.success('Día actualizado correctamente');
    } else {
        registros.push(registro);
        Toast.success('Día guardado correctamente');
    }

    registros.sort((a, b) => {
        if (a.año !== b.año) return a.año - b.año;
        if (a.mes !== b.mes) return a.mes - b.mes;
        return a.dia - b.dia;
    });

    guardarEnLocalStorage();
    renderizar();
    limpiarFormulario();
}

function limpiarFormulario() {
    els.fecha.value = '';
    els.horaFinal.value = '19:00';
    els.corrido.checked = false;
    els.motivo.value = '';
    els.esFeriado.checked = false;
    els.horaEntradaManual.value = '09:30';
    els.horaSalidaManual.value = '15:30';
    els.sabadoSalida.value = '12:30';
    actualizarPreview();
}

function eliminarDia(diaNum, mes, año) {
    if (confirm(`¿Eliminar el registro del día ${diaNum}/${mes+1}/${año}?`)) {
        registros = registros.filter(r => !(r.dia === diaNum && r.mes === mes && r.año === año));
        guardarEnLocalStorage();
        renderizar();
        Toast.warning('Registro eliminado');
    }
}

function borrarTodo() {
    if (confirm('¿Eliminar TODOS los registros?')) {
        registros = [];
        guardarEnLocalStorage();
        renderizar();
        Toast.warning('Todos los registros eliminados');
    }
}

// ========== LOCALSTORAGE ==========
function guardarEnLocalStorage() {
    try {
        localStorage.setItem('horasExtras_registros', JSON.stringify(registros));
    } catch (e) {
        Toast.error('No se pudo guardar en localStorage');
        console.warn(e);
    }
}

function cargarDeLocalStorage() {
    try {
        const data = localStorage.getItem('horasExtras_registros');
        if (data) {
            registros = JSON.parse(data);
            registros.sort((a, b) => {
                if (a.año !== b.año) return a.año - b.año;
                if (a.mes !== b.mes) return a.mes - b.mes;
                return a.dia - b.dia;
            });
        }
    } catch (e) {
        console.warn('No se pudo cargar de localStorage:', e);
    }
}

// ========== RENDERIZADO ==========
function renderizar() {
    const diasDelPeriodo = getDiasDelPeriodo();
    const registrosFiltrados = getRegistrosFiltrados();
    const registroMap = {};
    registrosFiltrados.forEach(r => { registroMap[r.fecha] = r; });

    let totalHrs = 0, normalesHrs = 0, extrasHrs = 0;
    const semanas = {};
    let html = '';

    diasDelPeriodo.forEach(fechaStr => {
        const diaNum = obtenerDiaDesdeFecha(fechaStr);
        const diaNombre = getDiaSemanaReal(fechaStr);
        const esDom = diaNombre === 'Domingo';
        const esSab = diaNombre === 'Sábado';
        const esFer = esFeriadoReal(fechaStr);

        let registro = registroMap[fechaStr];
        let h, esRegistrado = false;

        if (registro) {
            esRegistrado = true;
            h = {
                e1: registro.e1, s1: registro.s1, e2: registro.e2, s2: registro.s2,
                total: registro.total, normales: registro.normales, extras: registro.extras,
                esCorrido: registro.esCorrido, esManual: registro.esManual
            };
            totalHrs += registro.total;
            normalesHrs += registro.normales;
            extrasHrs += registro.extras;
            const s = registro.semana || 1;
            if (!semanas[s]) semanas[s] = 0;
            semanas[s] += registro.total;
        } else {
            if (esDom) {
                h = { e1: '', s1: '', e2: '', s2: '', total: 0, normales: 0, extras: 0, esCorrido: false, esManual: true };
            } else if (esSab) {
                h = { e1: '10:00', s1: '12:30', e2: '12:30', s2: '12:30', total: 2.5, normales: 2.5, extras: 0, esCorrido: true, esManual: false };
            } else {
                const base = getHorarioBase(diaNombre);
                h = { e1: base.e1, s1: base.s1, e2: base.e2, s2: base.s2, total: base.base, normales: base.base, extras: 0, esCorrido: false, esManual: false };
            }
        }

        let cls = '';
        let badge = '';
        if (esDom) { cls = 'domingo'; badge = '<span class="badge-domingo">D</span>'; }
        else if (esFer) { cls = 'feriado'; badge = '<span class="badge-feriado">🔴</span>'; }
        else if (esSab) { cls = 'sabado'; badge = '<span class="badge-sabado">S</span>'; }

        let horario;
        if (esDom) {
            horario = (h.e1 && h.s1) ? `${h.e1}→${h.s1}` : '—';
        } else if (esSab) {
            horario = `${h.e1}→${h.s1}`;
        } else if (h.esCorrido) {
            const base = getHorarioBase(diaNombre);
            horario = `${base.e1}→${base.s1} ${base.s1}→${h.s2}`;
        } else {
            const base = getHorarioBase(diaNombre);
            horario = `${base.e1}→${base.s1} ${base.e2}→${h.s2}`;
        }

        const corridoTag = h.esCorrido && !esDom && !esSab ? '<span class="corrido-badge">corrido</span>' : '';
        const extraStr = h.extras > 0 ? `+${h.extras.toFixed(1)}` : '-';
        const extraClass = h.extras > 0 ? 'extra' : '';
        const motivoStr = registro ? registro.motivo || '' : '';
        const motivoShort = motivoStr.length > 15 ? motivoStr.substring(0, 15) + '…' : motivoStr;
        const registradoTag = esRegistrado ? '<span class="guardado-ok">✓</span>' : '';

        html += `
            <tr class="${cls}">
                <td><strong>${diaNum}</strong><br><span style="font-size:0.55rem;color:#94a3b8;">${diaNombre.substring(0,3)}</span> ${badge} ${registradoTag}</td>
                <td><span class="badge-semana">${getSemana(diaNum, mesSeleccionado, añoSeleccionado)}</span></td>
                <td class="horario-cell">${horario} ${corridoTag}</td>
                <td>${h.total.toFixed(1)}</td>
                <td class="${extraClass}">${extraStr}</td>
                <td class="motivo-cell" title="${motivoStr}">${motivoShort || '-'}</td>
                <td>${esRegistrado ? `<button class="btn-xs" onclick="eliminarDia(${diaNum}, ${mesSeleccionado}, ${añoSeleccionado})">🗑️</button>` : ''}</td>
            </tr>
        `;
    });

    els.tablaBody.innerHTML = html || '<tr><td colspan="7" class="empty">Sin registros</td></tr>';

    els.sumTotal.textContent = totalHrs.toFixed(1);
    els.sumNormales.textContent = normalesHrs.toFixed(1);
    els.sumExtras.textContent = extrasHrs.toFixed(1);
    els.totalDias.textContent = registrosFiltrados.length;

    const semanasOrdenadas = Object.keys(semanas).sort((a, b) => parseInt(a) - parseInt(b));
    els.resumenSemana.textContent = semanasOrdenadas.map(s => `S${s}: ${semanas[s].toFixed(1)}`).join(' · ') || 'Sin datos';
    els.totalRegistrosLabel.textContent = `Total registros: ${registrosFiltrados.length} (de ${diasDelPeriodo.length} días)`;
}

// ========== EXPORTAR EXCEL ==========
function exportarExcel() {
    const diasDelPeriodo = getDiasDelPeriodo();
    const registrosFiltrados = getRegistrosFiltrados();

    if (diasDelPeriodo.length === 0) {
        Toast.error('No hay días en el período');
        return;
    }

    try {
        const data = [];
        const registroMap = {};
        registrosFiltrados.forEach(r => { registroMap[r.fecha] = r; });

        diasDelPeriodo.forEach(fechaStr => {
            const diaNum = obtenerDiaDesdeFecha(fechaStr);
            const diaNombre = getDiaSemanaReal(fechaStr);
            const esDom = diaNombre === 'Domingo';
            const esSab = diaNombre === 'Sábado';
            const esFer = esFeriadoReal(fechaStr);

            let registro = registroMap[fechaStr];
            let h;

            if (registro) {
                h = {
                    e1: registro.e1, s1: registro.s1, e2: registro.e2, s2: registro.s2,
                    e3: registro.feriadoEntrada3 || '', s3: registro.feriadoSalida3 || '',
                    total: registro.total, normales: registro.normales, extras: registro.extras,
                    esCorrido: registro.esCorrido, esManual: registro.esManual,
                    esFeriado: registro.esFeriado, motivo: registro.motivo || ''
                };
            } else {
                if (esDom) {
                    h = { e1: '', s1: '', e2: '', s2: '', e3: '', s3: '', total: 0, normales: 0, extras: 0, esCorrido: false, esManual: true, esFeriado: false, motivo: '' };
                } else if (esSab) {
                    h = { e1: '10:00', s1: '12:30', e2: '', s2: '', e3: '', s3: '', total: 2.5, normales: 2.5, extras: 0, esCorrido: true, esManual: false, esFeriado: false, motivo: '' };
                } else if (esFer) {
                    const base = getHorarioBase(diaNombre);
                    h = { e1: base.e1, s1: base.s1, e2: base.e2, s2: base.s2, e3: '', s3: '', total: base.base, normales: base.base, extras: 0, esCorrido: false, esManual: false, esFeriado: true, motivo: '' };
                } else {
                    const base = getHorarioBase(diaNombre);
                    h = { e1: base.e1, s1: base.s1, e2: base.e2, s2: base.s2, e3: '', s3: '', total: base.base, normales: base.base, extras: 0, esCorrido: false, esManual: false, esFeriado: false, motivo: '' };
                }
            }

            const totalHoras = h.total;
            const horasEnteras = Math.floor(totalHoras);
            const minutos = Math.round((totalHoras - horasEnteras) * 60);
            const totalStr = `${horasEnteras}:${String(minutos).padStart(2, '0')}`;
            const isDomingo = diaNombre === 'Domingo';

            data.push({
                'DÍA': `${diaNum}${diaNombre.substring(0,3)}`,
                'ENT.1': h.e1 || '',
                'SAL.1': h.s1 || '',
                'ENT.2': isDomingo ? '' : (h.e2 || ''),
                'SAL.2': isDomingo ? '' : (h.s2 || ''),
                'ENT.3': isDomingo ? '' : (h.e3 || ''),
                'SAL.3': isDomingo ? '' : (h.s3 || ''),
                'ENT.4': '',
                'SAL.4': '',
                'TPO. PERM.': '',
                'HORAS PERM.': '',
                'Total': totalStr,
                'Norm.': Math.round(h.normales * 100) / 100,
                'Extras': Math.round(h.extras * 100) / 100,
                'MOTIVO': h.motivo || ''
            });
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Horas Extras');

        ws['!cols'] = [
            { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
            { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 },
            { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 40 }
        ];

        const info = getPeriodoInfo(mesSeleccionado, añoSeleccionado);
        XLSX.writeFile(wb, `horas_extras_${info.nombreArchivo}.xlsx`);
        Toast.success('Excel descargado correctamente');
    } catch (e) {
        console.error('Error al exportar:', e);
        Toast.error('Error al exportar: ' + e.message);
    }
}

// ========== SELECTOR DE MESES ==========
function cargarSelectorMeses() {
    const hoy = new Date();
    let mesActual = hoy.getMonth();
    let añoActual = hoy.getFullYear();

    const opciones = [];
    let mesesGenerados = 0;
    let añoTemp = añoActual;
    let mesTemp = mesActual;

    while (mesesGenerados < 12 && añoTemp >= 2026) {
        opciones.push({ mes: mesTemp, año: añoTemp });
        mesesGenerados++;
        mesTemp--;
        if (mesTemp < 0) { mesTemp = 11; añoTemp--; }
    }

    if (opciones.length === 0) opciones.push({ mes: mesActual, año: añoActual });
    opciones.reverse();

    els.selectorMes.innerHTML = '';
    opciones.forEach((opt, idx) => {
        const option = document.createElement('option');
        const info = getPeriodoInfo(opt.mes, opt.año);
        option.value = `${opt.mes}|${opt.año}`;
        const esActual = (opt.mes === mesActual && opt.año === añoActual);
        option.textContent = `${MESES[opt.mes]} ${opt.año} ${esActual ? '(Actual)' : ''} (${info.label})`;
        els.selectorMes.appendChild(option);
        if (idx === 0) {
            option.selected = true;
            mesSeleccionado = opt.mes;
            añoSeleccionado = opt.año;
        }
    });
    actualizarPeriodoLabels();
}

function actualizarPeriodoLabels() {
    const info = getPeriodoInfo(mesSeleccionado, añoSeleccionado);
    els.periodoLabel.textContent = info.label;
    els.periodoBadge.textContent = '16 → 16';
    els.periodoSelectLabel.textContent = info.label;
    els.filtroPeriodoLabel.textContent = info.label;
    els.resumenPeriodo.textContent = info.label;
    FERIADOS = getFeriados(añoSeleccionado);
}

// ========== DETECCIÓN INTELIGENTE EN MOTIVO ==========
function detectarPalabrasClave() {
    const texto = els.motivo.value.toLowerCase();

    // Detectar "feriado"
    const tieneFeriado = texto.includes('feriado');
    if (tieneFeriado && !els.esFeriado.checked) {
        els.esFeriado.checked = true;
        actualizarPreview();
        Toast.info('Feriado detectado automáticamente');
    }

    // Detectar "corrido"
    const tieneCorrido = texto.includes('corrido');
    if (tieneCorrido && !els.corrido.checked) {
        els.corrido.checked = true;
        actualizarPreview();
        Toast.info('Jornada corrida detectada automáticamente');
    }

    // Detectar horas HH:MM
    const horaRegex = /\b(\d{1,2}):(\d{2})\b/g;
    const horasEncontradas = [];
    let match;
    while ((match = horaRegex.exec(texto)) !== null) {
        const h = parseInt(match[1]);
        const m = parseInt(match[2]);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
            horasEncontradas.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
        }
    }

    if (horasEncontradas.length >= 1) {
        const diaNombre = getDiaSemanaReal(els.fecha.value);
        const esDom = diaNombre === 'Domingo';
        const esSab = diaNombre === 'Sábado';
        const esFer = els.esFeriado.checked;

        if (esDom && horasEncontradas.length >= 2) {
            els.horaEntradaManual.value = horasEncontradas[0];
            els.horaSalidaManual.value = horasEncontradas[1];
            actualizarPreview();
            Toast.info(`Horas domingo: ${horasEncontradas[0]} → ${horasEncontradas[1]}`);
        } else if (esSab) {
            const ultima = horasEncontradas[horasEncontradas.length - 1];
            els.sabadoSalida.value = ultima;
            actualizarPreview();
            Toast.info(`Hora salida sábado: ${ultima}`);
        } else if (esFer && horasEncontradas.length >= 2) {
            els.feriadoEntrada3.value = horasEncontradas[0];
            els.feriadoSalida3.value = horasEncontradas[1];
            actualizarPreview();
            Toast.info(`Horas feriado: ${horasEncontradas[0]} → ${horasEncontradas[1]}`);
        } else {
            const ultima = horasEncontradas[horasEncontradas.length - 1];
            els.horaFinal.value = ultima;
            actualizarPreview();
            Toast.info(`Hora final actualizada: ${ultima}`);
        }
    }
}

// ========== EVENTOS ==========
function initEventos() {
    els.btnGuardar.addEventListener('click', guardarDia);
    els.btnLimpiarForm.addEventListener('click', limpiarFormulario);
    els.btnBorrarTodo.addEventListener('click', borrarTodo);
    els.btnExportarExcel.addEventListener('click', exportarExcel);

    els.selectorMes.addEventListener('change', function() {
        const [mes, año] = this.value.split('|').map(Number);
        mesSeleccionado = mes;
        añoSeleccionado = año;
        actualizarPeriodoLabels();
        renderizar();
    });

    // Inputs que actualizan preview
    ['fecha', 'horaFinal', 'corrido', 'esFeriado', 'horaEntradaManual', 'horaSalidaManual',
     'feriadoEntrada3', 'feriadoSalida3', 'sabadoSalida'].forEach(id => {
        const el = els[id];
        if (el) {
            const evento = (el.type === 'checkbox') ? 'change' : 'input';
            el.addEventListener(evento, actualizarPreview);
        }
    });

    // Detección inteligente en motivo
    els.motivo.addEventListener('input', detectarPalabrasClave);
}

// ========== INICIALIZACIÓN ==========
function init() {
    FERIADOS = getFeriados(2026);
    cargarSelectorMeses();
    cargarDeLocalStorage();
    initEventos();
    actualizarPreview();
    renderizar();
    console.log('✅ Sistema listo. Datos guardados en localStorage.');
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
