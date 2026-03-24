// app.js - UI interaction and Logic Binding

document.addEventListener('DOMContentLoaded', () => {

    // -- 0. V3: Load Persistence from LocalStorage --
    try {
        const savedProducts = JSON.parse(localStorage.getItem('detailCalc_products'));
        if (savedProducts && Array.isArray(savedProducts) && savedProducts.length > 0) {
            products.length = 0;
            savedProducts.forEach(p => products.push(p));
        }
        
        const savedConfig = JSON.parse(localStorage.getItem('detailCalc_shopConfig'));
        if (savedConfig) Object.assign(shopConfig, savedConfig);

        const savedServices = JSON.parse(localStorage.getItem('detailCalc_services'));
        if (savedServices && Array.isArray(savedServices) && savedServices.length > 0) {
            services.length = 0;
            savedServices.forEach(s => services.push(s));
        }
    } catch(e) {
        console.error("No se pudo cargar la configuración guardada:", e);
    }

    const vehicleGrid = document.getElementById('vehicleGrid');
    const servicesList = document.getElementById('servicesList');
    
    let selectedVehicleId = null;
    const selectedServices = new Set();
    const manualItemsList = [];

    // --- 1. Render Vehicles Selectors ---
    vehicleCategories.forEach(v => {
        const btn = document.createElement('div');
        btn.className = 'vehicle-item';
        btn.innerHTML = `
            <div class="icon">${v.icon}</div>
            <div class="type">${v.type}</div>
            <div class="factor">Mult: x${v.factor}</div>
        `;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.vehicle-item').forEach(el => el.classList.remove('selected'));
            btn.classList.add('selected');
            selectedVehicleId = v.id;
            updateQuoteUI();
        });
        vehicleGrid.appendChild(btn);
    });

    // --- 2. Render Services List (with edit buttons) ---
    function renderServicesList() {
        servicesList.innerHTML = '';
        selectedServices.clear(); // Reset selections on re-render

        services.forEach(s => {
            const wrapper = document.createElement('div');
            wrapper.className = 'service-item';
            wrapper.innerHTML = `
                <input type="checkbox" id="chk-${s.id}" value="${s.id}" style="display:none;">
                <span class="custom-checkbox"></span>
                <div class="service-info">
                    <span class="service-name">${s.name}</span>
                    <span class="service-time">⏱ ${s.baseTimeMinutes} min base</span>
                </div>
                <button class="btn-edit-service" data-sid="${s.id}" title="Editar servicio">⚙️</button>
            `;

            // Checkbox toggle on click (but not when clicking the gear button)
            const checkbox = wrapper.querySelector('input[type="checkbox"]');
            const customCb = wrapper.querySelector('.custom-checkbox');
            const serviceInfo = wrapper.querySelector('.service-info');
            
            const toggleCheck = () => {
                checkbox.checked = !checkbox.checked;
                if (checkbox.checked) selectedServices.add(s.id);
                else selectedServices.delete(s.id);
                updateQuoteUI();
            };

            customCb.addEventListener('click', toggleCheck);
            serviceInfo.addEventListener('click', toggleCheck);

            // Gear (Edit) button
            wrapper.querySelector('.btn-edit-service').addEventListener('click', (e) => {
                e.stopPropagation();
                openServiceModal(s.id);
            });

            servicesList.appendChild(wrapper);
        });

        updateQuoteUI();
    }

    renderServicesList();

    // --- 3. Service Edit/Create Modal ---
    const svcModal = document.getElementById('service-modal');
    const svcModalTitle = document.getElementById('service-modal-title');
    const btnCloseServiceModal = document.getElementById('btn-close-service-modal');
    const svcNameInput = document.getElementById('svc-name');
    const svcTimeInput = document.getElementById('svc-time');
    const svcProductsListEl = document.getElementById('svc-products-list');
    const svcAddProductSelect = document.getElementById('svc-add-product-select');
    const svcAddProductQty = document.getElementById('svc-add-product-qty');
    const btnSvcAddProduct = document.getElementById('btn-svc-add-product');
    const btnSaveService = document.getElementById('btn-save-service');
    const btnDeleteService = document.getElementById('btn-delete-service');
    const btnAddService = document.getElementById('btn-add-service');

    let currentEditServiceId = null; // null = creating new
    let tempProductsRequired = []; // Temp array while editing modal

    function populateSvcProductSelect() {
        svcAddProductSelect.innerHTML = '<option value="" disabled selected>Producto...</option>';
        products.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.name} (${p.unit})`;
            svcAddProductSelect.appendChild(opt);
        });
    }

    function renderSvcProductRows() {
        svcProductsListEl.innerHTML = '';
        if (tempProductsRequired.length === 0) {
            svcProductsListEl.innerHTML = '<p class="hint" style="margin:0;">Sin productos asignados aún.</p>';
            return;
        }
        tempProductsRequired.forEach((req, idx) => {
            const product = products.find(p => p.id === req.productId);
            const row = document.createElement('div');
            row.className = 'svc-product-row';
            row.innerHTML = `
                <span>${product ? product.name : '???'} — <strong>${req.baseUse}</strong> ${product ? product.unit : ''}</span>
                <span class="svc-row-remove" data-idx="${idx}">×</span>
            `;
            row.querySelector('.svc-row-remove').addEventListener('click', () => {
                tempProductsRequired.splice(idx, 1);
                renderSvcProductRows();
            });
            svcProductsListEl.appendChild(row);
        });
    }

    btnSvcAddProduct.addEventListener('click', () => {
        const pId = svcAddProductSelect.value;
        const qty = parseFloat(svcAddProductQty.value);
        if (!pId || isNaN(qty) || qty <= 0) return;
        tempProductsRequired.push({ productId: pId, baseUse: qty });
        svcAddProductQty.value = '';
        renderSvcProductRows();
    });

    function openServiceModal(serviceId = null) {
        currentEditServiceId = serviceId;
        populateSvcProductSelect();

        if (serviceId) {
            // Edit
            const svc = services.find(s => s.id === serviceId);
            svcModalTitle.textContent = '✏️ Editar Servicio';
            svcNameInput.value = svc.name;
            svcTimeInput.value = svc.baseTimeMinutes;
            tempProductsRequired = JSON.parse(JSON.stringify(svc.productsRequired)); // Deep clone
            btnDeleteService.style.display = 'inline-block';
        } else {
            // Create
            svcModalTitle.textContent = '＋ Crear Servicio Nuevo';
            svcNameInput.value = '';
            svcTimeInput.value = 60;
            tempProductsRequired = [];
            btnDeleteService.style.display = 'none';
        }

        renderSvcProductRows();
        svcModal.classList.remove('hidden');
    }

    btnCloseServiceModal.addEventListener('click', () => {
        svcModal.classList.add('hidden');
    });

    btnAddService.addEventListener('click', () => {
        openServiceModal(null);
    });

    btnSaveService.addEventListener('click', () => {
        const name = svcNameInput.value.trim();
        const time = parseInt(svcTimeInput.value);
        if (!name) return alert('El nombre del servicio es obligatorio.');
        if (isNaN(time) || time <= 0) return alert('El tiempo debe ser mayor a 0.');

        if (currentEditServiceId) {
            // Update existing
            const svc = services.find(s => s.id === currentEditServiceId);
            if (svc) {
                svc.name = name;
                svc.baseTimeMinutes = time;
                svc.productsRequired = JSON.parse(JSON.stringify(tempProductsRequired));
            }
        } else {
            // Create new
            const newId = 's_custom_' + Date.now();
            services.push({
                id: newId,
                name: name,
                baseTimeMinutes: time,
                productsRequired: JSON.parse(JSON.stringify(tempProductsRequired))
            });
        }

        // Persist
        localStorage.setItem('detailCalc_services', JSON.stringify(services));
        svcModal.classList.add('hidden');
        renderServicesList();
    });

    btnDeleteService.addEventListener('click', () => {
        if (!currentEditServiceId) return;
        if (!confirm('¿Eliminar este servicio permanentemente?')) return;
        const idx = services.findIndex(s => s.id === currentEditServiceId);
        if (idx > -1) {
            services.splice(idx, 1);
            selectedServices.delete(currentEditServiceId);
            localStorage.setItem('detailCalc_services', JSON.stringify(services));
            svcModal.classList.add('hidden');
            renderServicesList();
        }
    });

    // --- 4. Manual Items Logic ---
    const manualSelect = document.getElementById('manual-product-select');
    const manualQty = document.getElementById('manual-product-qty');
    const btnAddManual = document.getElementById('btn-add-manual');
    const chipsContainer = document.getElementById('manual-chips-container');
    const manualCostPreview = document.getElementById('manual-cost-preview');

    function populateManualSelect() {
        manualSelect.innerHTML = '<option value="" disabled selected>Elige un Insumo...</option>';
        products.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = `${p.name} (${p.unit})`;
            manualSelect.appendChild(option);
        });
    }

    function updateManualCostPreview() {
        const pId = manualSelect.value;
        const qty = parseFloat(manualQty.value);
        if (!pId || isNaN(qty) || qty <= 0) {
            manualCostPreview.textContent = '';
            return;
        }
        const product = products.find(p => p.id === pId);
        const costPerUnit = product.cost / product.content;
        const totalCost = costPerUnit * qty;
        manualCostPreview.textContent = `→ Costo estimado: ${formatCurrency(totalCost)} (${formatCurrency(costPerUnit)}/${product.unit})`;
    }

    manualSelect.addEventListener('change', updateManualCostPreview);
    manualQty.addEventListener('input', updateManualCostPreview);

    btnAddManual.addEventListener('click', () => {
        const pId = manualSelect.value;
        const qty = parseFloat(manualQty.value);
        if (!pId || isNaN(qty) || qty <= 0) return;
        manualItemsList.push({ id: 'm_' + Date.now(), productId: pId, amount: qty });
        renderChips();
        manualQty.value = '';
        manualCostPreview.textContent = '';
        updateQuoteUI();
    });

    function renderChips() {
        chipsContainer.innerHTML = '';
        manualItemsList.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            const chip = document.createElement('div');
            chip.className = 'chip';
            chip.innerHTML = `
                ${product.name} - ${item.amount}${product.unit}
                <span class="chip-close" data-id="${item.id}">×</span>
            `;
            chip.querySelector('.chip-close').addEventListener('click', (e) => {
                const idToRemove = e.target.getAttribute('data-id');
                const idx = manualItemsList.findIndex(i => i.id === idToRemove);
                if (idx > -1) {
                    manualItemsList.splice(idx, 1);
                    renderChips();
                    updateQuoteUI();
                }
            });
            chipsContainer.appendChild(chip);
        });
    }

    // --- 5. Configuration Modal Logic ---
    const modal = document.getElementById('config-modal');
    const btnOpenConfig = document.getElementById('btn-open-config');
    const btnCloseConfig = document.getElementById('btn-close-config');
    const btnSaveConfig = document.getElementById('btn-save-config');
    const inpHourly = document.getElementById('config-hourly');
    const inpMargin = document.getElementById('config-margin');
    const configProductsTbody = document.getElementById('config-products-tbody');

    function loadConfigIntoModal() {
        inpHourly.value = shopConfig.hourlyRate;
        inpMargin.value = Math.round(shopConfig.targetMargin * 100);
        configProductsTbody.innerHTML = '';
        products.forEach(p => {
            const tr = document.createElement('tr');
            tr.dataset.id = p.id;
            tr.innerHTML = `
                <td><input type="text"   class="input-modern cfg-name"    data-id="${p.id}" value="${p.name}" style="width:140px;"></td>
                <td>
                    <select class="input-modern cfg-unit" data-id="${p.id}">
                        <option value="ml"    ${p.unit==='ml'?'selected':''}>ml</option>
                        <option value="gr"    ${p.unit==='gr'?'selected':''}>gr</option>
                        <option value="pieza" ${p.unit==='pieza'?'selected':''}>pieza</option>
                        <option value="oz"    ${p.unit==='oz'?'selected':''}>oz</option>
                    </select>
                </td>
                <td><input type="number" class="input-modern cfg-cost"    data-id="${p.id}" value="${p.cost}"    step="0.01" style="width:80px;"></td>
                <td><input type="number" class="input-modern cfg-content" data-id="${p.id}" value="${p.content}" step="0.1"  style="width:70px;"></td>
                <td>
                    <button class="btn-del-prod" data-id="${p.id}" title="Eliminar producto">
                        🗑️
                    </button>
                </td>
            `;
            // Delete handler
            tr.querySelector('.btn-del-prod').addEventListener('click', () => {
                if (!confirm(`¿Eliminar "${p.name}" del catálogo?`)) return;
                const idx = products.findIndex(x => x.id === p.id);
                if (idx > -1) {
                    products.splice(idx, 1);
                    localStorage.setItem('detailCalc_products', JSON.stringify(products));
                    loadConfigIntoModal();
                    populateManualSelect();
                    populateSvcProductSelect();
                }
            });
            configProductsTbody.appendChild(tr);
        });
    }

    btnOpenConfig.addEventListener('click', () => { loadConfigIntoModal(); modal.classList.remove('hidden'); });
    btnCloseConfig.addEventListener('click', () => { modal.classList.add('hidden'); });

    // --- New Product in Catalog ---
    const btnNewProdAdd = document.getElementById('btn-new-prod-add');
    const newProdFeedback = document.getElementById('new-prod-feedback');

    btnNewProdAdd.addEventListener('click', () => {
        const name    = document.getElementById('new-prod-name').value.trim();
        const unit    = document.getElementById('new-prod-unit').value;
        const cost    = parseFloat(document.getElementById('new-prod-cost').value);
        const content = parseFloat(document.getElementById('new-prod-content').value);

        newProdFeedback.className = 'new-prod-feedback';

        if (!name) { newProdFeedback.textContent = '⚠️ Escribe el nombre del producto.'; newProdFeedback.classList.add('error'); return; }
        if (isNaN(cost) || cost <= 0) { newProdFeedback.textContent = '⚠️ El costo debe ser mayor a 0.'; newProdFeedback.classList.add('error'); return; }
        if (isNaN(content) || content <= 0) { newProdFeedback.textContent = '⚠️ El contenido debe ser mayor a 0.'; newProdFeedback.classList.add('error'); return; }

        const newId = 'p_custom_' + Date.now();
        products.push({ id: newId, name, unit, cost, content });
        localStorage.setItem('detailCalc_products', JSON.stringify(products));

        // Clear form
        document.getElementById('new-prod-name').value = '';
        document.getElementById('new-prod-cost').value = '';
        document.getElementById('new-prod-content').value = '';

        // Refresh all product selects and the catalog table
        loadConfigIntoModal();
        populateManualSelect();
        populateSvcProductSelect();

        newProdFeedback.textContent = `✅ "${name}" agregado al catálogo.`;
        newProdFeedback.classList.add('success');
        setTimeout(() => { newProdFeedback.textContent = ''; }, 3000);
    });

    btnSaveConfig.addEventListener('click', () => {
        const parsedHourly = parseFloat(inpHourly.value);
        const parsedMargin = parseFloat(inpMargin.value);
        if(!isNaN(parsedHourly)) shopConfig.hourlyRate = parsedHourly;
        if(!isNaN(parsedMargin)) shopConfig.targetMargin = parsedMargin / 100;

        configProductsTbody.querySelectorAll('tr').forEach(tr => {
            const pId = tr.dataset.id;
            const p = products.find(prod => prod.id === pId);
            if (!p) return;
            const nameVal = tr.querySelector('.cfg-name').value.trim();
            const unitVal = tr.querySelector('.cfg-unit').value;
            const costVal = parseFloat(tr.querySelector('.cfg-cost').value);
            const contVal = parseFloat(tr.querySelector('.cfg-content').value);
            if (nameVal) p.name = nameVal;
            if (unitVal) p.unit = unitVal;
            if (!isNaN(costVal) && costVal > 0) p.cost = costVal;
            if (!isNaN(contVal) && contVal > 0) p.content = contVal;
        });

        localStorage.setItem('detailCalc_products', JSON.stringify(products));
        localStorage.setItem('detailCalc_shopConfig', JSON.stringify(shopConfig));
        // Refresh selects with updated names
        populateManualSelect();
        populateSvcProductSelect();
        modal.classList.add('hidden');
        updateQuoteUI();
    });

    // --- 6. Calculation Logic ---
    function formatCurrency(val) {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
    }

    function resetSummaryUI() {
        ['sumMaterials', 'sumLabor', 'sumTotalCost', 'sumMarginAmount', 'sumFinalPrice'].forEach(id => {
            document.getElementById(id).textContent = '$0.00';
        });
        document.getElementById('sumHours').textContent = '0';
        const btnPdf = document.getElementById('btn-export-pdf');
        if (btnPdf) btnPdf.style.display = 'none';
    }

    function updateQuoteUI() {
        if (!selectedVehicleId || (selectedServices.size === 0 && manualItemsList.length === 0)) {
            resetSummaryUI();
            return;
        }
        try {
            const quote = generateQuote(selectedVehicleId, Array.from(selectedServices), manualItemsList);
            document.getElementById('sumMaterials').textContent = formatCurrency(quote.materials.total);
            document.getElementById('sumHours').textContent = quote.labor.timeHours.toFixed(1);
            document.getElementById('sumLabor').textContent = formatCurrency(quote.labor.total);
            document.getElementById('sumTotalCost').textContent = formatCurrency(quote.totalCost);
            document.getElementById('sumMarginPct').textContent = Math.round(shopConfig.targetMargin * 100);
            document.getElementById('sumMarginAmount').textContent = '+' + formatCurrency(quote.marginAmount);
            const finalPriceEl = document.getElementById('sumFinalPrice');
            finalPriceEl.textContent = formatCurrency(quote.suggestedPrice);
            finalPriceEl.classList.remove('pop-anim');
            void finalPriceEl.offsetWidth;
            finalPriceEl.classList.add('pop-anim');
            const btnPdf = document.getElementById('btn-export-pdf');
            if (btnPdf) btnPdf.style.display = 'flex';
        } catch (e) {
            console.error(e);
        }
    }
    
    // --- 7. V3 PDF Export (Pure jsPDF) ---
    const btnExportPdf = document.getElementById('btn-export-pdf');
    if (btnExportPdf) {
        btnExportPdf.addEventListener('click', () => {
            if (!selectedVehicleId) return alert('Selecciona un vehículo primero.');
            if (typeof window.jspdf === 'undefined') return alert('La librería PDF no se ha cargado. Verifica tu conexión a internet.');
            
            const quote = generateQuote(selectedVehicleId, Array.from(selectedServices), manualItemsList);
            const date = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pageW = doc.internal.pageSize.getWidth();
            let y = 25;

            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('Detallado Automotriz Profesional', pageW / 2, y, { align: 'center' });
            y += 8;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text('Cotizacion Oficial de Servicios', pageW / 2, y, { align: 'center' });
            y += 6;
            doc.setDrawColor(56, 189, 248);
            doc.setLineWidth(0.8);
            doc.line(20, y, pageW - 20, y);
            y += 12;

            doc.setTextColor(30, 41, 59);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Fecha:', 20, y);
            doc.setFont('helvetica', 'normal');
            doc.text(date, 42, y);
            doc.setFont('helvetica', 'bold');
            doc.text('Vehiculo:', pageW / 2, y);
            doc.setFont('helvetica', 'normal');
            doc.text(quote.vehicleType, pageW / 2 + 28, y);
            y += 14;

            // --- SECTION: Services Included ---
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.line(20, y, pageW - 20, y);
            y += 8;
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text('Servicios Incluidos', 20, y);
            y += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            Array.from(selectedServices).forEach(id => {
                const s = services.find(x => x.id === id);
                if (s) {
                    doc.text('•  ' + s.name + '  (' + (s.baseTimeMinutes * quote.factor).toFixed(0) + ' min aprox.)', 25, y);
                    y += 6;
                }
            });
            if (selectedServices.size === 0) {
                doc.text('•  Sin servicios base seleccionados.', 25, y); y += 6;
            }
            y += 6;

            // --- SECTION: Materials Breakdown Table ---
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.line(20, y, pageW - 20, y);
            y += 8;
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text('Desglose de Materiales', 20, y);
            y += 8;

            // Table header
            doc.setFillColor(241, 245, 249);
            doc.rect(20, y - 4, pageW - 40, 8, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text('Producto', 23, y);
            doc.text('Cant. Est.', 110, y);
            doc.text('Costo', pageW - 22, y, { align: 'right' });
            y += 7;

            // Table rows
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59);
            quote.materials.breakdown.forEach(m => {
                // zebra stripe
                doc.setFillColor(248, 250, 252);
                doc.rect(20, y - 4, pageW - 40, 7, 'F');

                const nameStr = m.isManual ? m.name + ' ★' : m.name;
                doc.setFontSize(9);
                doc.text(nameStr, 23, y);
                doc.text(m.amount.toFixed(1) + ' ' + m.unit, 110, y);
                doc.text(formatCurrency(m.cost), pageW - 22, y, { align: 'right' });
                y += 7;
            });

            if (manualItemsList.length > 0) {
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.setFont('helvetica', 'italic');
                doc.text('★ Insumo extra agregado manualmente', 23, y);
                y += 6;
            }
            y += 4;

            // --- SECTION: Labor Cost ---
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.line(20, y, pageW - 20, y);
            y += 8;
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text('Mano de Obra', 20, y);
            y += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text('Tiempo estimado:', 23, y);
            doc.setFont('helvetica', 'bold');
            doc.text(quote.labor.timeHours.toFixed(1) + ' hrs', 70, y);
            doc.setFont('helvetica', 'normal');
            doc.text('Tarifa por hora:', 100, y);
            doc.setFont('helvetica', 'bold');
            doc.text(formatCurrency(shopConfig.hourlyRate) + '/hr', 133, y);
            doc.text('= ' + formatCurrency(quote.labor.total), pageW - 22, y, { align: 'right' });
            y += 12;

            // --- SECTION: Totals ---
            doc.setDrawColor(56, 189, 248);
            doc.setLineWidth(0.6);
            doc.line(20, y, pageW - 20, y);
            y += 10;

            // Cost breakdown
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text('Subtotal materiales:', 20, y);
            doc.text(formatCurrency(quote.materials.total), pageW - 22, y, { align: 'right' }); y += 6;
            doc.text('Subtotal mano de obra:', 20, y);
            doc.text(formatCurrency(quote.labor.total), pageW - 22, y, { align: 'right' }); y += 6;
            doc.text('Margen (' + Math.round(shopConfig.targetMargin * 100) + '%):', 20, y);
            doc.text(formatCurrency(quote.marginAmount), pageW - 22, y, { align: 'right' }); y += 10;

            // Final price
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text('TOTAL COTIZADO:', 20, y);
            doc.text(formatCurrency(quote.suggestedPrice) + ' MXN', pageW - 22, y, { align: 'right' });
            y += 10;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(148, 163, 184);
            doc.text('* Precios sujetos a cambios de acuerdo al estado real de la pintura al momento del ingreso.', 20, y);
            doc.save('Cotizacion_Detallado.pdf');
        });
    }

    // Init App
    populateManualSelect();
    document.getElementById('sumMarginPct').textContent = Math.round(shopConfig.targetMargin * 100);
});
