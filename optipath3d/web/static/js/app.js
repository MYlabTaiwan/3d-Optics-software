/**
 * OptiPath 3D - Main Application Orchestrator
 * Connects UI controls, library sidebar, preview inspector, 3D bench scene,
 * raytracer, confocal physics engine, presets, themes, and image/3D export.
 */

class OptiPathApp {
    constructor() {
        window.app = this;
        this.benchScene = null;
        this.previewViewport = null;
        this.raytracer = null;
        this.periscopeWizard = null;
        this.selectedCatalogItem = null;
        this.initialized = false;

        const boot = () => {
            if (this.initialized) return;
            this.initialized = true;
            this.init();
        };

        if (document.readyState === "complete" || document.readyState === "interactive") {
            setTimeout(boot, 10);
        } else {
            window.addEventListener('DOMContentLoaded', boot);
            window.addEventListener('load', boot);
        }
    }

    init() {
        try {
            console.log("Initializing OptiPath 3D Workstation...");

            // 1. Initialize 3D Viewports
            this.benchScene = new OpticalBenchScene("main-canvas-container");
            this.previewViewport = new ComponentPreviewViewport("preview-canvas-container");
            this.raytracer = new OpticalRaytracer(this.benchScene);
            this.periscopeWizard = new PeriscopeWizard(this.benchScene);

            // 2. Build Library Catalog UI
            this.populateLibrary();

            // 3. Attach UI Event Handlers
            this.setupUIHandlers();

            // 4. Set Initial Theme (dark)
            this.setTheme("dark");

            // 5. Default Selected Preview Item: Zeiss Axio Imager or KM100
            this.selectLibraryItem("ZEISS-AXIO-IMG");

            // 6. Load initial recommended Raman & Zeiss Axio setup
            this.loadPreset("raman_zeiss_axio");
            this.updateTargetOpticDropdown();

            // 7. Ensure canvases immediately sync to CSS flexbox bounds
            requestAnimationFrame(() => {
                if (this.benchScene) this.benchScene.onResize();
                if (this.previewViewport) this.previewViewport.onResize();
            });
            setTimeout(() => {
                if (this.benchScene) this.benchScene.onResize();
                if (this.previewViewport) this.previewViewport.onResize();
            }, 120);

            console.log("OptiPath 3D initialized successfully.");
        } catch (error) {
            console.error("Critical error during OptiPath initialization:", error);
            this.showNotification("Initialization error: " + error.message, "error");
        }
    }

    /**
     * Theme switching: dark, dim, light
     */
    setTheme(themeName) {
        document.body.className = `theme-${themeName}`;
        if (this.benchScene) {
            this.benchScene.applyTheme(themeName);
        }

        document.querySelectorAll("[data-theme-btn]").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.themeBtn === themeName);
        });

        this.showNotification(`Theme switched to ${themeName.toUpperCase()}`, "info");
    }

    /**
     * Populates categorized component list on left sidebar
     */
    populateLibrary() {
        const libraryContainer = document.getElementById("catalog-accordion");
        if (!libraryContainer) return;

        libraryContainer.innerHTML = "";
        const catalog = window.COMPONENT_CATALOG;
        if (!catalog) return;

        const categories = {};
        for (const [id, comp] of Object.entries(catalog)) {
            const cat = comp.category || "General";
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(comp);
        }

        for (const [catName, items] of Object.entries(categories)) {
            const section = document.createElement("div");
            section.className = "category-section";

            const header = document.createElement("div");
            header.className = "category-header";
            header.innerHTML = `<span>${catName}</span> <span class="badge">${items.length}</span>`;
            header.addEventListener("click", () => {
                section.classList.toggle("collapsed");
            });

            const list = document.createElement("div");
            list.className = "category-items";

            items.forEach(item => {
                const itemCard = document.createElement("div");
                itemCard.className = "catalog-item-card";
                itemCard.dataset.id = item.id;

                let icon = "🔭";
                if (item.category === "Light Sources") icon = "⚡";
                else if (item.category === "Mirrors") icon = "🪞";
                else if (item.category === "Lenses") icon = "🔍";
                else if (item.category === "Confocal & Filters") icon = "🎯";
                else if (item.category === "Beamsplitters") icon = "💎";
                else if (item.category === "Polarization") icon = "🔄";
                else if (item.category === "Periscopes & Cage") icon = "🏗️";
                else if (item.category === "Microscopes") icon = "🔬";
                else if (item.category === "Spectrometers & Detectors") icon = "📷";
                else if (item.category === "Multi-Level Decks") icon = "📦";

                itemCard.innerHTML = `
                    <div class="card-icon">${icon}</div>
                    <div class="card-info">
                        <div class="card-title">${item.name}</div>
                        <div class="card-meta"><code>${item.part_no || item.id}</code> · ${item.vendor}</div>
                    </div>
                `;

                itemCard.addEventListener("click", () => {
                    document.querySelectorAll(".catalog-item-card").forEach(c => c.classList.remove("active"));
                    itemCard.classList.add("active");
                    this.selectLibraryItem(item.id);
                });

                list.appendChild(itemCard);
            });

            section.appendChild(header);
            section.appendChild(list);
            libraryContainer.appendChild(section);
        }
    }

    /**
     * Updates Preview Inspector with selected component in 3D
     */
    selectLibraryItem(catalogId) {
        try {
            const data = window.COMPONENT_CATALOG[catalogId];
            if (!data) return;

            this.selectedCatalogItem = data;
            if (this.previewViewport) {
                this.previewViewport.showComponent(data);
            }
        } catch (err) {
            console.error("Error displaying preview component:", err);
        }
    }

    /**
     * Adds the currently previewed component to the optical table
     */
    addPreviewedToTable() {
        try {
            if (!this.selectedCatalogItem) {
                this.showNotification("Please select a component first.", "warning");
                return;
            }

            const comp = this.benchScene.addComponent(this.selectedCatalogItem.id);
            if (comp) {
                this.updateTargetOpticDropdown(comp.id);
                this.showNotification(`Added ${this.selectedCatalogItem.name} to bench.`, "success");
            }
        } catch (err) {
            console.error("Error adding component:", err);
            this.showNotification("Failed to add component: " + err.message, "error");
        }
    }

    /**
     * Sets up UI event listeners
     */
    setupUIHandlers() {
        // Theme buttons
        document.querySelectorAll("[data-theme-btn]").forEach(btn => {
            btn.addEventListener("click", () => {
                this.setTheme(btn.dataset.themeBtn);
            });
        });

        // Add to Table Button in Preview Inspector
        const addBtn = document.getElementById("btn-add-preview-to-table");
        if (addBtn) {
            addBtn.addEventListener("click", () => this.addPreviewedToTable());
        }

        // Preview Turntable auto-rotate toggle
        const rotateBtn = document.getElementById("btn-preview-autorotate");
        if (rotateBtn) {
            rotateBtn.addEventListener("click", () => {
                if (this.previewViewport) {
                    const active = this.previewViewport.toggleAutoRotate();
                    rotateBtn.classList.toggle("active", active);
                }
            });
        }

        // Reset Preview Camera
        const resetPreviewCamBtn = document.getElementById("btn-preview-reset-cam");
        if (resetPreviewCamBtn) {
            resetPreviewCamBtn.addEventListener("click", () => {
                if (this.previewViewport) this.previewViewport.resetCamera();
            });
        }

        // Search Input
        const searchInput = document.getElementById("catalog-search-input");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                const query = e.target.value.toLowerCase().trim();
                document.querySelectorAll(".catalog-item-card").forEach(card => {
                    const text = card.innerText.toLowerCase();
                    card.style.display = text.includes(query) ? "flex" : "none";
                });
            });
        }

        // Transform Tool Buttons
        const toolTranslate = document.getElementById("tool-translate");
        const toolRotate = document.getElementById("tool-rotate");
        const toolDelete = document.getElementById("tool-delete");

        if (toolTranslate) {
            toolTranslate.addEventListener("click", () => {
                this.benchScene.setTransformMode("translate");
                toolTranslate.classList.add("active");
                if (toolRotate) toolRotate.classList.remove("active");
            });
        }

        if (toolRotate) {
            toolRotate.addEventListener("click", () => {
                this.benchScene.setTransformMode("rotate");
                toolRotate.classList.add("active");
                if (toolTranslate) toolTranslate.classList.remove("active");
            });
        }

        if (toolDelete) {
            toolDelete.addEventListener("click", () => {
                this.benchScene.deleteSelectedComponent();
            });
        }

        // Camera Preset Buttons
        document.querySelectorAll("[data-cam-preset]").forEach(btn => {
            btn.addEventListener("click", () => {
                const preset = btn.dataset.camPreset;
                this.benchScene.setCameraPreset(preset);
            });
        });

        // Grid Snap & Ray Snap Toggles
        const snapToggle = document.getElementById("toggle-grid-snap");
        if (snapToggle) {
            snapToggle.addEventListener("change", (e) => {
                this.benchScene.snapToGrid = e.target.checked;
            });
        }

        const raySnapToggle = document.getElementById("toggle-ray-snap");
        if (raySnapToggle) {
            raySnapToggle.addEventListener("change", (e) => {
                this.benchScene.snapToRay = e.target.checked;
            });
        }

        // 3D Billboard Labels Toggle (M1, L1, FM1...)
        const labelsToggle = document.getElementById("toggle-3d-labels");
        if (labelsToggle) {
            labelsToggle.addEventListener("change", (e) => {
                this.benchScene.toggleLabels(e.target.checked);
            });
        }

        // Target Component Selector for Continuous Beam Placement
        const targetSelect = document.getElementById("select-target-component");
        if (targetSelect) {
            targetSelect.addEventListener("change", () => this.onTargetOpticChanged());
        }

        // Add After Target Component Button
        const addAfterBtn = document.getElementById("btn-add-after-target");
        if (addAfterBtn) {
            addAfterBtn.addEventListener("click", () => this.addPreviewedAfterTarget());
        }

        // Auto-level buttons in Selection Inspector
        document.querySelectorAll("[data-autolevel]").forEach(btn => {
            btn.addEventListener("click", () => {
                this.benchScene.autoLevelSelected(btn.dataset.autolevel);
                this.showNotification(`Auto-leveled height to ${btn.innerText}`, "info");
            });
        });

        // Screenshot Export
        const exportPngBtn = document.getElementById("btn-export-screenshot");
        if (exportPngBtn) {
            exportPngBtn.addEventListener("click", () => {
                this.benchScene.exportScreenshot();
                this.showNotification("Exported 3D CAD Screenshot (PNG)", "success");
            });
        }

        // 3D Scene JSON Export
        const exportSceneBtn = document.getElementById("btn-export-scene");
        if (exportSceneBtn) {
            exportSceneBtn.addEventListener("click", () => {
                this.benchScene.export3DSceneJSON();
                this.showNotification("Exported 3D Scene Layout (JSON)", "success");
            });
        }

        // Confocal Physics Simulator Modal Open
        const openConfocalBtn = document.getElementById("btn-open-confocal-calc");
        if (openConfocalBtn) {
            openConfocalBtn.addEventListener("click", () => {
                this.updateConfocalPhysicsCalc();
                this.openModal("confocal-modal");
            });
        }

        // Confocal Calculation Inputs
        ['confocal-lambda', 'confocal-na', 'confocal-mag', 'confocal-tubelens'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this.updateConfocalPhysicsCalc());
        });

        // Add Calculated Confocal Pinhole to Table
        const addConfocalBtn = document.getElementById("btn-add-confocal-pinhole");
        if (addConfocalBtn) {
            addConfocalBtn.addEventListener("click", () => {
                this.benchScene.addComponent("CONFOCAL-PINHOLE-MPH");
                this.closeModal("confocal-modal");
                this.showNotification("Added Confocal Pinhole with optimal 1 AU aperture.", "success");
            });
        }

        // Periscope Wizard Modal Open & Generate
        const openPeriBtn = document.getElementById("btn-open-periscope-wizard");
        if (openPeriBtn) {
            openPeriBtn.addEventListener("click", () => {
                this.openModal("periscope-modal");
            });
        }

        const genPeriBtn = document.getElementById("btn-generate-periscope");
        if (genPeriBtn) {
            genPeriBtn.addEventListener("click", () => {
                const type = document.getElementById("peri-type-select").value;
                const inH = parseFloat(document.getElementById("peri-in-height").value) || 100;
                const outH = parseFloat(document.getElementById("peri-out-height").value) || 200;
                const dir = document.getElementById("peri-exit-dir").value;

                this.periscopeWizard.generatePeriscope({
                    type: type,
                    inputHeight: inH,
                    outputHeight: outH,
                    exitDirection: dir
                });

                this.closeModal("periscope-modal");
                this.showNotification("Periscope & cage assembly generated.", "success");
            });
        }

        // Periscope Quick Preset Buttons
        const periZeissTop = document.getElementById("peri-preset-zeiss-top");
        if (periZeissTop) {
            periZeissTop.addEventListener("click", () => {
                document.getElementById("peri-out-height").value = "500.0";
                document.getElementById("peri-exit-dir").value = "forward";
                this.showNotification("Periscope preset configured: Zeiss Top Laser (500mm)", "info");
            });
        }

        const periZeissRear = document.getElementById("peri-preset-zeiss-rear");
        if (periZeissRear) {
            periZeissRear.addEventListener("click", () => {
                document.getElementById("peri-out-height").value = "350.0";
                document.getElementById("peri-exit-dir").value = "forward";
                this.showNotification("Periscope preset configured: Zeiss Rear Laser (350mm)", "info");
            });
        }

        const periOlympusSide = document.getElementById("peri-preset-olympus-side");
        if (periOlympusSide) {
            periOlympusSide.addEventListener("click", () => {
                document.getElementById("peri-out-height").value = "155.0";
                document.getElementById("peri-exit-dir").value = "left";
                this.showNotification("Periscope preset configured: Olympus Side Port (155mm)", "info");
            });
        }

        const periOlympusEpi = document.getElementById("peri-preset-olympus-epi");
        if (periOlympusEpi) {
            periOlympusEpi.addEventListener("click", () => {
                document.getElementById("peri-out-height").value = "215.0";
                document.getElementById("peri-exit-dir").value = "forward";
                this.showNotification("Periscope preset configured: Olympus Epi Port (215mm)", "info");
            });
        }

        // Selection Inspector: Microscope Optical Port Configuration
        const topPortSelect = document.getElementById("insp-top-port");
        if (topPortSelect) {
            topPortSelect.addEventListener("change", (e) => {
                const comp = this.benchScene.selectedComponent;
                if (comp && comp.data.type === "microscope_frame") {
                    this.benchScene.updateMicroscopePortConfig(comp, { top_port: e.target.value });
                    this.showNotification(`Updated Top Port to ${e.target.options[e.target.selectedIndex].text}`, "success");
                }
            });
        }

        const leftPortSelect = document.getElementById("insp-left-port");
        if (leftPortSelect) {
            leftPortSelect.addEventListener("change", (e) => {
                const comp = this.benchScene.selectedComponent;
                if (comp && comp.data.type === "microscope_frame") {
                    this.benchScene.updateMicroscopePortConfig(comp, { left_port: e.target.value });
                    this.showNotification(`Updated Left Port to ${e.target.options[e.target.selectedIndex].text}`, "success");
                }
            });
        }

        const retroRouteSelect = document.getElementById("insp-retro-route");
        if (retroRouteSelect) {
            retroRouteSelect.addEventListener("change", (e) => {
                const comp = this.benchScene.selectedComponent;
                if (comp && comp.data.type === "microscope_frame") {
                    comp.data.retro_route = e.target.value;
                    if (this.raytracer) this.raytracer.updateBeams();
                    this.showNotification(`Updated Retro-Path route to ${e.target.options[e.target.selectedIndex].text}`, "success");
                }
            });
        }

        const presetRetroDmSpectro = document.getElementById("btn-preset-retro-dm-spectro");
        if (presetRetroDmSpectro) {
            presetRetroDmSpectro.addEventListener("click", () => {
                const comp = this.benchScene.selectedComponent;
                if (comp && comp.data.type === "microscope_frame") {
                    comp.data.retro_route = "retro_dm";
                    this.benchScene.updateMicroscopePortConfig(comp, { top_port: "laser_in", left_port: "closed", retro_route: "retro_dm" });
                    if (retroRouteSelect) retroRouteSelect.value = "retro_dm";
                    if (this.raytracer) this.raytracer.updateBeams();
                    this.showNotification("Configured: Retro-Collection to DM & Spectrometer", "success");
                }
            });
        }

        const presetTopLaserLeftCam = document.getElementById("btn-preset-top-laser-left-cam");
        if (presetTopLaserLeftCam) {
            presetTopLaserLeftCam.addEventListener("click", () => {
                const comp = this.benchScene.selectedComponent;
                if (comp && comp.data.type === "microscope_frame") {
                    this.benchScene.updateMicroscopePortConfig(comp, { top_port: "laser_in", left_port: "camera" });
                    if (topPortSelect) topPortSelect.value = "laser_in";
                    if (leftPortSelect) leftPortSelect.value = "camera";
                    this.showNotification("Configured: Top Laser In + Left Axiocam Camera", "success");
                }
            });
        }

        const presetTopCamLeftSpec = document.getElementById("btn-preset-top-cam-left-spectro");
        if (presetTopCamLeftSpec) {
            presetTopCamLeftSpec.addEventListener("click", () => {
                const comp = this.benchScene.selectedComponent;
                if (comp && comp.data.type === "microscope_frame") {
                    this.benchScene.updateMicroscopePortConfig(comp, { top_port: "camera", left_port: "spectrometer" });
                    if (topPortSelect) topPortSelect.value = "camera";
                    if (leftPortSelect) leftPortSelect.value = "spectrometer";
                    this.showNotification("Configured: Top Axiocam Camera + Left Spectrometer Port", "success");
                }
            });
        }

        // Deck Manager Modal Open & Actions
        const openDeckBtn = document.getElementById("btn-open-deck-mgr");
        if (openDeckBtn) {
            openDeckBtn.addEventListener("click", () => {
                this.renderDeckList();
                this.openModal("deck-modal");
            });
        }

        const createDeckBtn = document.getElementById("btn-create-deck");
        if (createDeckBtn) {
            createDeckBtn.addEventListener("click", () => {
                const w = parseFloat(document.getElementById("deck-input-w").value) || 450;
                const l = parseFloat(document.getElementById("deck-input-l").value) || 600;
                const h = parseFloat(document.getElementById("deck-input-h").value) || 200;
                const name = document.getElementById("deck-input-name").value || "Elevated Deck";

                this.benchScene.addDeck(w, l, h, name);
                this.renderDeckList();
                this.showNotification(`Created ${name} at +${h}mm.`, "success");
            });
        }

        // Recommended Setup Presets Dropdown
        const presetSelect = document.getElementById("preset-setup-select");
        if (presetSelect) {
            presetSelect.addEventListener("change", (e) => {
                if (e.target.value) {
                    this.loadPreset(e.target.value);
                    e.target.value = ""; // Reset dropdown
                }
            });
        }

        // Bill of Materials (BOM) Modal Open
        const openBomBtn = document.getElementById("btn-open-bom");
        if (openBomBtn) {
            openBomBtn.addEventListener("click", () => {
                this.renderBOM();
                this.openModal("bom-modal");
            });
        }

        // Close Modal buttons
        document.querySelectorAll(".modal-close-btn, .modal-backdrop").forEach(el => {
            el.addEventListener("click", (e) => {
                if (e.target === el) {
                    const modal = el.closest(".modal-container");
                    if (modal) modal.style.display = "none";
                }
            });
        });

        // Clear Bench Button
        const clearBtn = document.getElementById("btn-clear-bench");
        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                if (confirm("Are you sure you want to clear the optical bench?")) {
                    this.clearBench();
                }
            });
        }

        // Inspector Position / Rotation change hooks
        ['insp-pos-x', 'insp-pos-y', 'insp-pos-z', 'insp-rot-y'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => this.applyInspectorChanges());
            }
        });

        // Inspector Custom Component Label Edit (M1, L1, FM1...)
        const customLabelInput = document.getElementById("insp-custom-label");
        if (customLabelInput) {
            customLabelInput.addEventListener("change", (e) => {
                const comp = this.benchScene.selectedComponent;
                if (comp) {
                    this.benchScene.updateComponentLabel(comp, e.target.value);
                    this.showNotification(`Component label updated to ${comp.label}`, "info");
                }
            });
        }

        // Kinematic Flip Mount Action Buttons (TRF90)
        const btnFlipEngaged = document.getElementById("btn-flip-engaged");
        if (btnFlipEngaged) {
            btnFlipEngaged.addEventListener("click", () => {
                const comp = this.benchScene.selectedComponent;
                if (comp) {
                    this.benchScene.toggleFlipMirrorState(comp, "engaged");
                    this.benchScene.updateInspectorFields(comp);
                    if (this.raytracer) this.raytracer.updateBeams();
                    this.showNotification(`Flip mirror ${comp.label} engaged (90° perpendicular reflection).`, "info");
                }
            });
        }

        const btnFlipBypassed = document.getElementById("btn-flip-bypassed");
        if (btnFlipBypassed) {
            btnFlipBypassed.addEventListener("click", () => {
                const comp = this.benchScene.selectedComponent;
                if (comp) {
                    this.benchScene.toggleFlipMirrorState(comp, "bypassed");
                    this.benchScene.updateInspectorFields(comp);
                    if (this.raytracer) this.raytracer.updateBeams();
                    this.showNotification(`Flip mirror ${comp.label} bypassed (straight horizontal path).`, "info");
                }
            });
        }

        // Global Mount Visibility Toggle Button (Mounts ON vs Optics Only)
        const btnToggleMounts = document.getElementById("btn-toggle-mounts");
        if (btnToggleMounts) {
            btnToggleMounts.addEventListener("click", () => {
                const isVis = this.benchScene.toggleMountsVisibility();
                btnToggleMounts.classList.toggle("active", isVis);
                btnToggleMounts.innerHTML = isVis ? "🏗️ Mounts: ON" : "👓 Optics Only";
                this.showNotification(isVis ? "Mechanical mounts & hardware visible." : "Optics-only display activated (hardware hidden).", "info");
            });
        }

        // Per-Component Mount Visibility Toggle Checkbox
        const showMountCheck = document.getElementById("insp-show-mount");
        if (showMountCheck) {
            showMountCheck.addEventListener("change", (e) => {
                const comp = this.benchScene.selectedComponent;
                if (comp) {
                    this.benchScene.setComponentMountVisibility(comp, e.target.checked);
                    const mountLabel = document.getElementById("insp-mount-label");
                    if (mountLabel) mountLabel.innerText = e.target.checked ? "Visible" : "Hidden";
                    this.showNotification(`Mounts for ${comp.label} ${e.target.checked ? 'shown' : 'hidden'}.`, "info");
                }
            });
        }

        // Periscope Elevation Delta Input
        const periElevInput = document.getElementById("insp-peri-elevation");
        if (periElevInput) {
            periElevInput.addEventListener("change", (e) => {
                const comp = this.benchScene.selectedComponent;
                if (comp) {
                    const val = parseFloat(e.target.value) || 100;
                    this.benchScene.updatePeriscopeElevation(comp, val);
                    this.showNotification(`Periscope ${comp.label} elevation set to ${val}mm.`, "info");
                }
            });
        }

        // Periscope Overhead 30mm Cage Arm Checkbox
        const periArmCheck = document.getElementById("insp-peri-overhead-arm");
        if (periArmCheck) {
            periArmCheck.addEventListener("change", (e) => {
                const comp = this.benchScene.selectedComponent;
                if (comp) {
                    this.benchScene.updatePeriscopeOverheadArm(comp, e.target.checked);
                    this.showNotification(`Periscope overhead cage arm ${e.target.checked ? 'enabled' : 'disabled'}.`, "info");
                }
            });
        }

        // Cube Base Insert Selector (dichroic / BS inserts)
        const cubeInsertSel = document.getElementById("insp-cube-insert");
        if (cubeInsertSel) {
            cubeInsertSel.addEventListener("change", (e) => {
                const comp = this.benchScene.selectedComponent;
                if (comp) {
                    this.benchScene.setCubeInsert(comp, e.target.value);
                    this.showNotification(`${comp.label} insert changed to ${e.target.options[e.target.selectedIndex].text}.`, "info");
                }
            });
        }

        // Component Level Selector (table / deck)
        const levelSel = document.getElementById("insp-level-select");
        if (levelSel) {
            levelSel.addEventListener("change", (e) => {
                const comp = this.benchScene.selectedComponent;
                if (comp) {
                    this.benchScene.setComponentLevel(comp, e.target.value);
                    this.showNotification(`${comp.label} moved to ${e.target.options[e.target.selectedIndex].text}.`, "info");
                }
            });
        }

        // Custom Optical Component Modal Open & Save
        const openCustomBtn = document.getElementById("btn-open-custom-optic-modal");
        if (openCustomBtn) {
            openCustomBtn.addEventListener("click", () => {
                this.openModal("custom-optic-modal");
            });
        }

        const saveCustomBtn = document.getElementById("btn-save-custom-optic");
        if (saveCustomBtn) {
            saveCustomBtn.addEventListener("click", () => {
                this.registerCustomOptic();
            });
        }
    }

    applyInspectorChanges() {
        const comp = this.benchScene.selectedComponent;
        if (!comp) return;

        const posX = parseFloat(document.getElementById('insp-pos-x').value) || 0;
        const posY = parseFloat(document.getElementById('insp-pos-y').value) || 100;
        const posZ = parseFloat(document.getElementById('insp-pos-z').value) || 0;
        const rotY = parseFloat(document.getElementById('insp-rot-y').value) || 0;

        comp.mesh.position.set(posX, posY, posZ);
        comp.mesh.rotation.y = THREE.MathUtils.degToRad(rotY);

        this.benchScene.onComponentMoved(comp);
    }

    /**
     * Live Confocal Physics Calculation
     */
    updateConfocalPhysicsCalc() {
        const lambda = parseFloat(document.getElementById("confocal-lambda").value) || 532.0;
        const na = parseFloat(document.getElementById("confocal-na").value) || 0.90;
        const mag = parseFloat(document.getElementById("confocal-mag").value) || 100.0;
        const tubeFocal = parseFloat(document.getElementById("confocal-tubelens").value) || 164.5; // Zeiss default

        // Airy disk radius at sample: 0.61 * lambda / NA (in microns)
        const r_airy_sample = (0.61 * (lambda * 1e-3)) / na;
        const d_airy_pinhole = 2.0 * r_airy_sample * mag;

        // FWHM resolutions
        const fwhm_xy = (0.37 * (lambda * 1e-3)) / na;
        const fwhm_z = (1.4 * (lambda * 1e-3) * 1.0) / (na * na);

        // Find standard commercial pinhole
        const stdPinholes = [10, 15, 20, 25, 30, 50, 75, 100, 150];
        const bestPinhole = stdPinholes.reduce((prev, curr) => Math.abs(curr - d_airy_pinhole) < Math.abs(prev - d_airy_pinhole) ? curr : prev);

        const resEl = document.getElementById("confocal-calc-results");
        if (resEl) {
            resEl.innerHTML = `
                <tr><td>Specimen Airy Radius:</td><td><strong>${r_airy_sample.toFixed(3)} µm</strong></td></tr>
                <tr><td>Ideal 1 AU Pinhole Diameter:</td><td><strong>${d_airy_pinhole.toFixed(1)} µm</strong></td></tr>
                <tr><td>Recommended Standard Pinhole:</td><td><strong style="color: var(--accent-emerald);">Ø${bestPinhole} µm (Thorlabs P${bestPinhole}S)</strong></td></tr>
                <tr><td>Lateral Resolution (FWHM xy):</td><td><strong>${(fwhm_xy * 1e3).toFixed(0)} nm</strong></td></tr>
                <tr><td>Axial Sectioning (FWHM z):</td><td><strong>${fwhm_z.toFixed(2)} µm</strong></td></tr>
                <tr><td>Confocal Optical Volume:</td><td><strong>${((Math.PI / 6) * fwhm_xy * fwhm_xy * fwhm_z * 1e3).toFixed(2)} fL</strong></td></tr>
            `;
        }
    }

    /**
     * Renders active decks list in Deck Manager modal
     */
    renderDeckList() {
        const listEl = document.getElementById("deck-items-list");
        if (!listEl) return;

        let html = "";
        this.benchScene.placedDecks.forEach(deck => {
            html += `
                <div class="status-box" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div>
                        <strong>${deck.name}</strong><br>
                        <small>Size: ${deck.width} × ${deck.length} mm | Elevation: +${deck.elevation} mm</small>
                    </div>
                    <button class="btn-tool btn-danger btn-mini" onclick="window.app.benchScene.removeDeck('${deck.id}'); window.app.renderDeckList();">Remove</button>
                </div>
            `;
        });

        if (this.benchScene.placedDecks.length === 0) {
            html = "<p style='color: var(--text-muted); font-size: 12px;'>No elevated decks placed. Click 'Create Elevated Deck' above.</p>";
        }
        listEl.innerHTML = html;
    }

    clearBench() {
        while (this.benchScene.placedComponents.length > 0) {
            this.benchScene.selectComponent(this.benchScene.placedComponents[0]);
            this.benchScene.deleteSelectedComponent();
        }
        [...this.benchScene.placedDecks].forEach(d => this.benchScene.removeDeck(d.id));
        if (this.raytracer) {
            this.raytracer.updateBeams();
        }
        this.updateStatusTelemetry();
        this.updateTargetOpticDropdown();
    }

    /**
     * Builds the standard excitation chain:
     * Laser -> Clean-up filter -> M1 -> M2 -> HWP -> Dichroic cube (DM)
     * The beam leaves the laser along +X, M1 turns it to +Z, M2 turns it back to +X,
     * and the DM at (-50, y, -50) reflects it to +Z towards the microscope.
     * @param {Object} opts { elevation: deck surface height (0 = optical table), laserId, cleanupId, dmId }
     */
    addExcitationChain(opts = {}) {
        const elev = opts.elevation || 0;
        const y = elev + 100;
        const ov = { level_elevation_mm: elev, default_height_mm: 100.0 };
        const S = this.benchScene;

        S.addComponent(opts.laserId || "F280FC-532", { x: -450, y: y, z: -300 }, 90, ov);
        S.addComponent(opts.cleanupId || "LASER-CLEANUP-FILTER", { x: -380, y: y, z: -300 }, 90, ov);
        S.addComponent("KM100", { x: -300, y: y, z: -300 }, -45, ov);   // M1: +X -> +Z
        S.addComponent("KM100", { x: -300, y: y, z: -50 }, -45, ov);    // M2: +Z -> +X
        S.addComponent("PRM1-HWP", { x: -200, y: y, z: -50 }, 90, ov);
        S.addComponent(opts.dmId || "DICHROIC-CAGE-CUBE", { x: -50, y: y, z: -50 }, 0, ov);
    }

    /**
     * Recommended Preset Setups (Raman, Zeiss Axio Imager, PL, 4f Relay)
     */
    loadPreset(presetName) {
        try {
            this.clearBench();

            // 0a. THORLABS 30mm CAGE PERISCOPE WITH HORIZONTAL OVERHEAD CAGE ARM DIRECT TO ZEISS AXIO IMAGER
            if (presetName === "raman_deck_two_mirror") {
                // LEVEL 2: laser, clean-up filter, 2 mirrors, HWP, DM and detection arm on an elevated deck.
                // Deck surface at 220 mm -> beam height 320 mm = Zeiss top phototube height (no periscope needed).
                const elev = 220;
                const deck = this.benchScene.addDeck(1000, 460, elev, "Deck 2 (Laser & Detection)");
                deck.group.position.set(-50, elev, -170);
                this.addExcitationChain({ elevation: elev });

                // Fold mirror turns the beam down into the top port; grounded on a tall post to the table
                this.benchScene.addComponent("KM100", { x: -50, y: 320, z: 315 }, { x: -45, y: 0, z: 0 });

                const scope = this.benchScene.addComponent("ZEISS-AXIO-IMG", { x: -50, y: 0, z: 350 }, 0);
                if (scope) {
                    this.benchScene.updateMicroscopePortConfig(scope, {
                        top_port: "laser_in", left_port: "closed", rear_port: "closed", retro_route: "retro_dm"
                    });
                }

                const ov = { level_elevation_mm: elev, default_height_mm: 100.0 };
                this.benchScene.addComponent("CONFOCAL-PINHOLE-MPH", { x: 120, y: 320, z: -50 }, 90, ov);
                this.benchScene.addComponent("RAMAN-EDGE-FILTER", { x: 220, y: 320, z: -50 }, 90, ov);
                this.benchScene.addComponent("PRINCETON-ISOPLANE", { x: 380, y: 320, z: -50 }, 90, ov);

                this.showNotification("Loaded 2nd-deck laser chain: Laser → Filter → M1 → M2 → HWP → DM → Zeiss.", "success");
            }
            else if (presetName === "raman_table_two_mirror") {
                // LEVEL 1: everything on the optical table, cage periscope raises beam to the top port
                this.addExcitationChain({ elevation: 0 });
                this.benchScene.addComponent("CAGE-PERISCOPE-30", { x: -50, y: 100, z: 120 }, 0, { elevation_delta_mm: 220.0 });
                this.benchScene.addComponent("KM100", { x: -50, y: 320, z: 315 }, { x: -45, y: 0, z: 0 });

                const scope = this.benchScene.addComponent("ZEISS-AXIO-IMG", { x: -50, y: 0, z: 350 }, 0);
                if (scope) {
                    this.benchScene.updateMicroscopePortConfig(scope, {
                        top_port: "laser_in", left_port: "closed", rear_port: "closed", retro_route: "retro_dm"
                    });
                }
                this.benchScene.addComponent("CONFOCAL-PINHOLE-MPH", { x: 120, y: 100, z: -50 }, 90);
                this.benchScene.addComponent("RAMAN-EDGE-FILTER", { x: 220, y: 100, z: -50 }, 90);
                this.benchScene.addComponent("PRINCETON-ISOPLANE", { x: 380, y: 100, z: -50 }, 90);

                this.showNotification("Loaded table-level laser chain: Laser → Filter → M1 → M2 → HWP → DM → Periscope → Zeiss.", "success");
            }
            else if (presetName === "periscope_overhead_cage_raman") {
                this.addExcitationChain({ elevation: 0 });

                // Rigid 30mm Cage Periscope with Continuous 195mm Overhead Cage Arm directly over phototube
                this.benchScene.addComponent("CAGE-PERISCOPE-30", { x: -50, y: 100, z: 120 }, 0, {
                    elevation_delta_mm: 220.0,
                    has_overhead_arm: true,
                    overhead_arm_length_mm: 195.0
                });

                // Zeiss Axio Imager Research Microscope (Top port at Z = 350 - 35 = 315, Y = 234)
                const scope = this.benchScene.addComponent("ZEISS-AXIO-IMG", { x: -50, y: 0, z: 350 }, 0);
                if (scope) {
                    this.benchScene.updateMicroscopePortConfig(scope, {
                        top_port: "laser_in",
                        left_port: "closed",
                        rear_port: "closed",
                        retro_route: "retro_dm"
                    });
                }

                // Retro-Collection Raman Arm
                this.benchScene.addComponent("CONFOCAL-PINHOLE-MPH", { x: 120, y: 100, z: -50 }, 90);
                this.benchScene.addComponent("RAMAN-EDGE-FILTER", { x: 220, y: 100, z: -50 }, 90);
                this.benchScene.addComponent("PRINCETON-ISOPLANE", { x: 380, y: 100, z: -50 }, 90);
                this.benchScene.addComponent("ANDOR-IXON", { x: 380, y: 100, z: 50 }, 0);

                this.showNotification("Loaded Thorlabs 30mm Cage Periscope & Overhead Arm into Zeiss Axio Imager.", "success");
            }
            // 0. PERISCOPE + 90° MIRROR -> ZEISS AXIO -> RETRO DM -> SPECTROMETER (FULL CONFOCAL RAMAN/PL)
            else if (presetName === "periscope_retro_raman") {
                // 1-5. Laser (Table) -> Clean-up filter -> M1 -> M2 -> HWP -> Dichroic cube (DM)
                this.addExcitationChain({ elevation: 0 });

                // 6. 30mm Cage Periscope (Elevates laser from 100mm to 320mm)
                this.benchScene.addComponent("CAGE-PERISCOPE-30", { x: -50, y: 100, z: 120 }, 0, { elevation_delta_mm: 220.0 });

                // 7. 90° Kinematic Fold Mirror (M2) at elevated height (Y = 320mm) directing into microscope top port
                this.benchScene.addComponent("KM100", { x: -50, y: 320, z: 315 }, { x: -45, y: 0, z: 0 });

                // 8. Zeiss Axio Imager Research Microscope (Top port at Z = 350 - 35 = 315, Y = 234)
                const scope = this.benchScene.addComponent("ZEISS-AXIO-IMG", { x: -50, y: 0, z: 350 }, 0);
                if (scope) {
                    this.benchScene.updateMicroscopePortConfig(scope, {
                        top_port: "laser_in",
                        left_port: "closed",
                        rear_port: "closed",
                        retro_route: "retro_dm"
                    });
                }

                // 9. Retro-Collection Raman Arm
                this.benchScene.addComponent("CONFOCAL-PINHOLE-MPH", { x: 120, y: 100, z: -50 }, 90);
                this.benchScene.addComponent("RAMAN-EDGE-FILTER", { x: 220, y: 100, z: -50 }, 90);
                this.benchScene.addComponent("PRINCETON-ISOPLANE", { x: 380, y: 100, z: -50 }, 90);
                this.benchScene.addComponent("ANDOR-IXON", { x: 380, y: 100, z: 50 }, 0);

                this.showNotification("Loaded Confocal Raman with Periscope 90° Mirror & Retro DM to Spectrometer.", "success");
            }
            // 0b. 2ND-LEVEL DECK + 90° MIRROR -> RETRO DM -> SPECTROMETER
            else if (presetName === "deck2_retro_raman") {
                this.benchScene.addDeck(500, 600, 200, "Deck 1 (Microscope Overhead)");

                this.benchScene.addComponent("F280FC-532", { x: -350, y: 100, z: -250 }, 0);
                this.benchScene.addComponent("LASER-CLEANUP-FILTER", { x: -350, y: 100, z: -150 }, 0);
                this.benchScene.addComponent("KM100", { x: -350, y: 100, z: -30 }, -45);
                this.benchScene.addComponent("DICHROIC-CAGE-CUBE", { x: -50, y: 100, z: -30 }, 0);

                this.benchScene.addComponent("CAGE-PERISCOPE-30", { x: -50, y: 100, z: 100 }, 0, { elevation_delta_mm: 200.0 });

                // 90° Fold mirror on Deck 1 directing beam down into microscope top port (Z = 320 - 35 = 285)
                this.benchScene.addComponent("KM100", { x: -50, y: 300, z: 285 }, { x: -45, y: 0, z: 0 });

                const scope = this.benchScene.addComponent("ZEISS-AXIO-IMG", { x: -50, y: 0, z: 320 }, 0);
                if (scope) {
                    this.benchScene.updateMicroscopePortConfig(scope, {
                        top_port: "laser_in",
                        left_port: "closed",
                        rear_port: "closed",
                        retro_route: "retro_dm"
                    });
                }

                this.benchScene.addComponent("CONFOCAL-PINHOLE-MPH", { x: 120, y: 100, z: -30 }, 90);
                this.benchScene.addComponent("RAMAN-EDGE-FILTER", { x: 220, y: 100, z: -30 }, 90);
                this.benchScene.addComponent("PRINCETON-ISOPLANE", { x: 380, y: 100, z: -30 }, 90);

                this.showNotification("Loaded 2nd-Level Elevated Deck with 90° Mirror, Retro DM & Spectrometer.", "success");
            }
            // 0c. ZEISS AXIO IMAGER (TOP LASER INJECTION + LEFT AXIOCAM CAMERA)
            else if (presetName === "zeiss_top_laser_left_cam") {
                // 532nm Green Laser Collimator on Table (Y = 100mm)
                this.benchScene.addComponent("F280FC-532", { x: 0, y: 100, z: -350 }, 0);
                this.benchScene.addComponent("LASER-CLEANUP-FILTER", { x: 0, y: 100, z: -250 }, 0);

                // Thorlabs 30mm Cage Periscope (Elevates laser from 100mm to 234mm for top port injection)
                this.benchScene.addComponent("CAGE-PERISCOPE-30", { x: 0, y: 100, z: -160 }, 0, { elevation_delta_mm: 134.0 });

                // Zeiss Axio Imager Upright Research Microscope with Top Laser In & Left Camera
                const scope = this.benchScene.addComponent("ZEISS-AXIO-IMG", { x: 0, y: 0, z: 120 }, 0);
                if (scope) {
                    this.benchScene.updateMicroscopePortConfig(scope, {
                        top_port: "laser_in",
                        left_port: "camera",
                        rear_port: "closed"
                    });
                }

                this.showNotification("Loaded Zeiss Axio Imager with Top Laser In & Left Axiocam Camera.", "success");
            }
            // 1. RAMAN + ZEISS AXIO IMAGER SETUP (Matches user's uploaded image!)
            else if (presetName === "raman_zeiss_axio") {
                // Laser -> Clean-up filter -> M1 -> M2 -> HWP -> Dichroic cube (DM)
                this.addExcitationChain({ elevation: 0 });
                // 30mm Cage Periscope (Elevates beam from 100mm to 320mm)
                this.benchScene.addComponent("CAGE-PERISCOPE-30", { x: -50, y: 100, z: 120 }, 0, { elevation_delta_mm: 220.0 });

                // 90° Fold mirror directing beam down into microscope top port (Z = 350 - 35 = 315, Y = 320)
                this.benchScene.addComponent("KM100", { x: -50, y: 320, z: 315 }, { x: -45, y: 0, z: 0 });

                // Zeiss Axio Imager Upright Research Microscope (Matching user image)
                const scope = this.benchScene.addComponent("ZEISS-AXIO-IMG", { x: -50, y: 0, z: 350 }, 0);
                if (scope) {
                    this.benchScene.updateMicroscopePortConfig(scope, {
                        top_port: "laser_in",
                        left_port: "closed",
                        rear_port: "closed",
                        retro_route: "retro_dm"
                    });
                }

                // Confocal Pinhole on Raman collection arm
                this.benchScene.addComponent("CONFOCAL-PINHOLE-MPH", { x: 120, y: 100, z: -50 }, 90);
                // RazorEdge Raman Edge Filter
                this.benchScene.addComponent("RAMAN-EDGE-FILTER", { x: 220, y: 100, z: -50 }, 90);
                // Princeton Instruments IsoPlane Spectrograph & CCD
                this.benchScene.addComponent("PRINCETON-ISOPLANE", { x: 380, y: 100, z: -50 }, 90);

                this.showNotification("Loaded Confocal Raman with Zeiss Axio Imager & Princeton IsoPlane.", "success");
            }
            // 2. CONFOCAL MICRO-RAMAN & PL SUITE WITH OLYMPUS IX73
            else if (presetName === "confocal_pl") {
                this.benchScene.addComponent("F280FC-532", { x: -300, y: 100, z: -250 }, 0);
                this.benchScene.addComponent("KM100", { x: -300, y: 100, z: -50 }, -45);
                this.benchScene.addComponent("DICHROIC-CAGE-CUBE", { x: 0, y: 100, z: -50 }, 0);
                const peri = this.benchScene.addComponent("CAGE-PERISCOPE-30", { x: 0, y: 100, z: 100 }, 0, { elevation_delta_mm: 55.0 }); // 100mm -> 155mm
                this.benchScene.addComponent("OLYMPUS-IX73", { x: 160, y: 0, z: 250 }, 0);
                this.benchScene.addComponent("CONFOCAL-PINHOLE-MPH", { x: 120, y: 100, z: -50 }, 90);
                this.benchScene.addComponent("ANDOR-SHAMROCK", { x: 300, y: 100, z: -50 }, 90);

                this.showNotification("Loaded Confocal PL & Raman Suite with Olympus IX73 & Andor Shamrock.", "success");
            }
            // 3. 4F TELECENTRIC RELAY & BEAM EXPANDER
            else if (presetName === "4f_relay") {
                this.benchScene.addComponent("F280FC-532", { x: -300, y: 100, z: -150 }, 0);
                this.benchScene.addComponent("LMR1-AC50", { x: -300, y: 100, z: -30 }, 0);
                this.benchScene.addComponent("CONFOCAL-PINHOLE-MPH", { x: -300, y: 100, z: 20 }, 0);
                this.benchScene.addComponent("LMR1-AC200", { x: -300, y: 100, z: 220 }, 0);
                this.benchScene.addComponent("KM100", { x: -300, y: 100, z: 350 }, -45);

                this.showNotification("Loaded 4f Telecentric 4x Beam Expander & Spatial Filter.", "success");
            }

            this.benchScene.selectComponent(null);
            if (this.raytracer) {
                if (this.raytracer) {
            this.raytracer.updateBeams();
        }
            }
            this.updateStatusTelemetry();
            this.updateTargetOpticDropdown();
        } catch (err) {
            console.error("Error loading preset:", err);
        }
    }

    /**
     * Updates target optic dropdown (#select-target-component) with all placed components
     */
    updateTargetOpticDropdown(selectedCompId = null) {
        const selectEl = document.getElementById("select-target-component");
        if (!selectEl) return;

        const currentVal = selectedCompId || selectEl.value;
        selectEl.innerHTML = '<option value="">(Select Optic)</option>';

        if (!this.benchScene || !this.benchScene.placedComponents) return;

        this.benchScene.placedComponents.forEach(comp => {
            const opt = document.createElement("option");
            opt.value = comp.id;
            const label = comp.label || "OPT";
            const name = comp.data.name || comp.catalog_id;
            const part = comp.data.part_no || comp.catalog_id;
            opt.innerText = `${label}: ${name} (${part})`;
            if (comp.id === currentVal) {
                opt.selected = true;
            }
            selectEl.appendChild(opt);
        });

        this.onTargetOpticChanged();
    }

    /**
     * Handles target component selection change; toggles flip mirror path options
     */
    onTargetOpticChanged() {
        const selectEl = document.getElementById("select-target-component");
        const branchOptionsEl = document.getElementById("target-branch-options");
        if (!selectEl || !branchOptionsEl) return;

        const targetId = selectEl.value;
        const targetComp = this.benchScene ? this.benchScene.placedComponents.find(c => c.id === targetId) : null;

        if (targetComp && (targetComp.data.is_flip_mirror || targetComp.data.type === "flip_mirror")) {
            branchOptionsEl.style.display = "block";
        } else {
            branchOptionsEl.style.display = "none";
        }
    }

    /**
     * Adds the currently previewed component along the beam path departing from the selected target optic
     */
    addPreviewedAfterTarget() {
        try {
            if (!this.selectedCatalogItem) {
                this.showNotification("Please select a component from the catalog first.", "warning");
                return;
            }

            const selectEl = document.getElementById("select-target-component");
            const targetId = selectEl ? selectEl.value : null;
            if (!targetId) {
                this.showNotification("Please select a target optic (e.g. M1, L1) to add after.", "warning");
                return;
            }

            const targetComp = this.benchScene.placedComponents.find(c => c.id === targetId);
            if (!targetComp) {
                this.showNotification("Selected target optic not found on table.", "error");
                return;
            }

            // Determine branch: perpendicular vs straight (for flip mirror) or primary
            let branch = "primary";
            const isFlip = targetComp.data.is_flip_mirror || targetComp.data.type === "flip_mirror";
            if (isFlip) {
                const checkedRadio = document.querySelector('input[name="target-branch-path"]:checked');
                branch = checkedRadio ? checkedRadio.value : "perpendicular";
            }

            const distInput = document.getElementById("input-after-distance");
            const distance = distInput ? (parseFloat(distInput.value) || 125.0) : 125.0;

            const newComp = this.benchScene.addComponentAfter(targetComp, this.selectedCatalogItem.id, {
                branch: branch,
                distance: distance
            });

            if (newComp) {
                this.benchScene.selectComponent(newComp);
                this.updateTargetOpticDropdown(newComp.id);
                this.showNotification(`Added ${newComp.label || newComp.data.name} along beam path after ${targetComp.label || 'target'}.`, "success");
            }
        } catch (err) {
            console.error("Error adding component after target:", err);
            this.showNotification("Failed to add component along beam: " + err.message, "error");
        }
    }

    /**
     * Registers a custom user optic into the catalog and adds it to the bench or along beam path
     */
    registerCustomOptic() {
        try {
            const name = document.getElementById("cust-name")?.value.trim() || "Custom Optic";
            const part = document.getElementById("cust-part")?.value.trim() || ("CUST-" + Date.now().toString().slice(-4));
            const type = document.getElementById("cust-type")?.value || "lens";
            const vendor = document.getElementById("cust-vendor")?.value.trim() || "Custom";
            const diameter = parseFloat(document.getElementById("cust-diameter")?.value) || 25.4;
            const focal = parseFloat(document.getElementById("cust-focal")?.value) || 75.0;

            const id = "CUSTOM-" + part.replace(/[^a-zA-Z0-9_-]/g, "");

            let category = "Custom Optics";
            if (type === "mirror" || type === "flip_mirror") category = "Mirrors";
            else if (type === "lens") category = "Lenses";
            else if (type === "filter_edge" || type === "confocal_pinhole") category = "Confocal & Filters";
            else if (type === "beamsplitter_cube") category = "Beamsplitters";

            const customItem = {
                id: id,
                name: name,
                part_no: part,
                category: category,
                vendor: vendor,
                type: type,
                is_flip_mirror: type === "flip_mirror",
                flip_state: type === "flip_mirror" ? "engaged" : undefined,
                focal_length_mm: type === "lens" ? focal : undefined,
                clear_aperture_mm: diameter,
                description: `${name} (${part}) - Custom ${category} component`,
                specifications: {
                    diameter: `Ø${diameter} mm`,
                    focal_length: type === "lens" ? `${focal} mm` : "N/A",
                    vendor: vendor
                },
                dimensions: {
                    width: 32,
                    height: 52,
                    length: 22
                },
                optical_axis_height: 100.0,
                post_stack: {
                    base: "BA2",
                    post_holder: "PH50",
                    post: "TR75"
                }
            };

            window.COMPONENT_CATALOG[id] = customItem;
            this.populateLibrary();
            this.selectLibraryItem(id);
            this.closeModal("custom-optic-modal");

            // Check if user currently has a target optic selected to place along path
            const targetSelect = document.getElementById("select-target-component");
            if (targetSelect && targetSelect.value) {
                const targetComp = this.benchScene.placedComponents.find(c => c.id === targetSelect.value);
                if (targetComp) {
                    const isFlip = targetComp.data.is_flip_mirror || targetComp.data.type === "flip_mirror";
                    const checkedRadio = document.querySelector('input[name="target-branch-path"]:checked');
                    const branch = isFlip ? (checkedRadio?.value || "perpendicular") : "primary";
                    const distInput = document.getElementById("input-after-distance");
                    const dist = distInput ? (parseFloat(distInput.value) || 125.0) : 125.0;

                    const newComp = this.benchScene.addComponentAfter(targetComp, id, { branch: branch, distance: dist });
                    if (newComp) {
                        this.benchScene.selectComponent(newComp);
                        this.updateTargetOpticDropdown(newComp.id);
                        this.showNotification(`Registered and added ${newComp.label} along beam path after ${targetComp.label}.`, "success");
                        return;
                    }
                }
            }

            const comp = this.benchScene.addComponent(id);
            if (comp) {
                this.updateTargetOpticDropdown(comp.id);
                this.showNotification(`Registered and added ${comp.label || name} to bench.`, "success");
            }
        } catch (err) {
            console.error("Error creating custom optic:", err);
            this.showNotification("Error creating custom optic: " + err.message, "error");
        }
    }

    /**
     * Renders Bill of Materials (BOM) in modal
     */
    renderBOM() {
        const bomTableBody = document.getElementById("bom-table-body");
        const totalItemsEl = document.getElementById("bom-total-items");
        const totalCountEl = document.getElementById("bom-total-count");
        if (!bomTableBody) return;

        const partsMap = {};
        let totalCount = 0;

        this.benchScene.placedComponents.forEach(comp => {
            const data = comp.data;
            const partNo = data.part_no || data.id;

            if (!partsMap[partNo]) {
                partsMap[partNo] = {
                    part_no: partNo,
                    name: data.name,
                    category: data.category,
                    vendor: data.vendor,
                    quantity: 1
                };
            } else {
                partsMap[partNo].quantity += 1;
            }
            totalCount += 1;

            if (data.post_stack && data.post_stack.base !== "DIRECT") {
                const ps = data.post_stack;
                [ps.base, ps.post_holder, ps.post].forEach(p => {
                    if (p) {
                        if (!partsMap[p]) {
                            partsMap[p] = {
                                part_no: p,
                                name: `Thorlabs Optomechanical Hardware (${p})`,
                                category: "Mounts & Hardware",
                                vendor: "Thorlabs",
                                quantity: 1
                            };
                        } else {
                            partsMap[p].quantity += 1;
                        }
                        totalCount += 1;
                    }
                });
            }
        });

        const items = Object.values(partsMap);
        let html = "";
        items.forEach(item => {
            const url = item.vendor === "Thorlabs" ? `https://www.thorlabs.com/thorproduct.cfm?partnumber=${item.part_no}` : "#";
            html += `
                <tr>
                    <td><code>${item.part_no}</code></td>
                    <td>${item.name}</td>
                    <td><span class="badge">${item.category}</span></td>
                    <td><strong>${item.quantity}</strong></td>
                    <td>${item.vendor}</td>
                    <td><a href="${url}" target="_blank" class="catalog-link">Order Page ↗</a></td>
                </tr>
            `;
        });

        bomTableBody.innerHTML = html;
        if (totalItemsEl) totalItemsEl.innerText = items.length;
        if (totalCountEl) totalCountEl.innerText = totalCount;
    }

    exportBOMtoCSV() {
        const rows = [["Part Number", "Description", "Category", "Quantity", "Vendor"]];
        document.querySelectorAll("#bom-table-body tr").forEach(tr => {
            const cols = Array.from(tr.querySelectorAll("td")).slice(0, 5).map(td => `"${td.innerText.replace(/"/g, '""')}"`);
            rows.push(cols);
        });

        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "OptiPath3D_Thorlabs_BOM.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    updateStatusTelemetry() {
        const countEl = document.getElementById("telem-component-count");
        if (countEl) {
            countEl.innerText = this.benchScene.placedComponents.length;
        }
    }

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = "flex";
    }

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = "none";
    }

    showNotification(msg, type = "info") {
        const toast = document.getElementById("app-toast");
        if (!toast) return;

        toast.className = `toast toast-${type} show`;
        toast.innerText = msg;
        setTimeout(() => {
            toast.className = "toast";
        }, 3200);
    }
}

window.app = new OptiPathApp();
