/**
 * OptiPath 3D - Main Optical Bench Three.js Scene Engine
 * Manages:
 * - 3D Breadboard with tapped hole grid texture
 * - Themes: Dark Lab, Dim / Laser-Safe Amber, Clean Light CAD
 * - Multi-level decks (Add, remove, resize, auto-level heights)
 * - Intelligent Optical Axis Ray-Snap & 4f Conjugate Pairing
 * - Screenshot Image Export & 3D Scene Export
 */

class OpticalBenchScene {
    constructor(canvasContainerId) {
        this.container = document.getElementById(canvasContainerId);
        if (!this.container) {
            console.error(`Canvas container #${canvasContainerId} not found.`);
            return;
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.orbitControls = null;
        this.transformControls = null;

        this.tableGroup = new THREE.Group();
        this.componentsGroup = new THREE.Group();
        this.beamGroup = new THREE.Group();
        this.decksGroup = new THREE.Group();

        this.placedComponents = [];
        this.placedDecks = [];
        this.selectedComponent = null;

        this.gridPitch = 25.0; // Metric 25mm default
        this.snapToGrid = true;
        this.snapToRay = true; // Smart Ray-Snap default
        this.showLabels = true; // 3D Optical Component Label Badges (M1, L1, etc.)
        this.globalMountsVisible = true; // Mounts ON / Optics Only toggle
        this.activeDeckLevel = 0;
        this.currentTheme = "dark";

        this.tableDimensions = { width: 900, length: 1200, thickness: 58 };

        this.init();
    }

    init() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        // 1. Scene Setup
        this.scene = new THREE.Scene();
        this.applyTheme(this.currentTheme);

        // 2. Camera Setup
        this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
        this.camera.position.set(650, 750, 950);

        // 3. Renderer Setup (preserveDrawingBuffer enables high-res screenshot exports!)
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;

        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // 4. OrbitControls
        this.orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;
        this.orbitControls.maxPolarAngle = Math.PI / 2 + 0.05;
        this.orbitControls.target.set(0, 100, 0);

        // 5. TransformControls (Gizmo)
        if (typeof THREE.TransformControls !== 'undefined') {
            this.transformControls = new THREE.TransformControls(this.camera, this.renderer.domElement);
            this.transformControls.size = 0.75;
            this.transformControls.setTranslationSnap(this.gridPitch);
            this.transformControls.setRotationSnap(THREE.MathUtils.degToRad(15));

            this.transformControls.addEventListener('dragging-changed', (event) => {
                this.orbitControls.enabled = !event.value;
                if (!event.value) {
                    this.onComponentMoved(this.selectedComponent);
                }
            });

            this.transformControls.addEventListener('change', () => {
                if (this.selectedComponent) {
                    this.updateInspectorFields(this.selectedComponent);
                    if (window.app && window.app.raytracer) {
                        window.app.raytracer.updateBeams();
                    }
                }
            });

            this.scene.add(this.transformControls);
        }

        // 6. Lighting Setup
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
        this.scene.add(this.ambientLight);

        this.mainDirLight = new THREE.DirectionalLight(0xffffff, 0.85);
        this.mainDirLight.position.set(400, 1200, 500);
        this.mainDirLight.castShadow = true;
        this.mainDirLight.shadow.mapSize.width = 2048;
        this.mainDirLight.shadow.mapSize.height = 2048;
        this.scene.add(this.mainDirLight);

        this.fillLight = new THREE.DirectionalLight(0x5c7cfa, 0.4);
        this.fillLight.position.set(-600, 400, -600);
        this.scene.add(this.fillLight);

        // Add groups to scene
        this.scene.add(this.tableGroup);
        this.scene.add(this.decksGroup);
        this.scene.add(this.componentsGroup);
        this.scene.add(this.beamGroup);

        // 7. Build Optical Table (Deck 0)
        this.buildOpticalTable();

        // 8. Mouse Events for Selection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.renderer.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));

        // 9. Resize Listener & Observer
        window.addEventListener('resize', () => this.onResize());
        if (window.ResizeObserver && this.container) {
            this.resizeObserver = new ResizeObserver(() => this.onResize());
            this.resizeObserver.observe(this.container);
        }

        // Start render loop
        this.animate = this.animate.bind(this);
        this.animate();
    }

    /**
     * Theme switching: dark, dim (laser-safe amber), light (clean CAD)
     */
    applyTheme(themeName) {
        this.currentTheme = themeName;
        if (!this.scene) return;

        if (themeName === "dim") {
            // Laser-safe dark room / amber mode
            this.scene.background = new THREE.Color(0x0c0803);
            this.scene.fog = new THREE.FogExp2(0x0c0803, 0.0004);
            if (this.ambientLight) this.ambientLight.color.setHex(0xffaa44);
            if (this.fillLight) this.fillLight.color.setHex(0xaa4400);
        } else if (themeName === "light") {
            // Clean technical CAD light mode
            this.scene.background = new THREE.Color(0xebedf2);
            this.scene.fog = new THREE.FogExp2(0xebedf2, 0.00025);
            if (this.ambientLight) this.ambientLight.color.setHex(0xffffff);
            if (this.fillLight) this.fillLight.color.setHex(0xb0c4de);
        } else {
            // Default dark laboratory slate
            this.scene.background = new THREE.Color(0x0e121a);
            this.scene.fog = new THREE.FogExp2(0x0e121a, 0.00035);
            if (this.ambientLight) this.ambientLight.color.setHex(0xffffff);
            if (this.fillLight) this.fillLight.color.setHex(0x5c7cfa);
        }

        // Re-generate table texture to match theme tone
        this.buildOpticalTable();
    }

    buildOpticalTable() {
        this.tableGroup.clear();

        const w = this.tableDimensions.width;
        const l = this.tableDimensions.length;
        const t = this.tableDimensions.thickness;

        const isLight = this.currentTheme === "light";
        const isDim = this.currentTheme === "dim";

        let tableColor = isLight ? 0xc8ced9 : (isDim ? 0x1f160f : 0x242a35);
        let holeColor = isLight ? 0x8a94a6 : (isDim ? 0x0a0502 : 0x0f141d);
        let holeStroke = isLight ? 0xa0abc0 : (isDim ? 0x3d2815 : 0x3e4859);

        // Table Top Honeycomb Stainless Steel Surface
        const tableGeo = new THREE.BoxGeometry(w, t, l);
        const tableMat = new THREE.MeshStandardMaterial({
            color: tableColor,
            metalness: 0.82,
            roughness: 0.28
        });
        const tableMesh = new THREE.Mesh(tableGeo, tableMat);
        tableMesh.position.y = -t / 2;
        tableMesh.receiveShadow = true;
        this.tableGroup.add(tableMesh);

        // Procedural Tapped Holes Texture Grid
        const gridCanvas = document.createElement('canvas');
        gridCanvas.width = 1024;
        gridCanvas.height = 1024;
        const ctx = gridCanvas.getContext('2d');

        ctx.fillStyle = isLight ? '#dbe0e8' : (isDim ? '#18110b' : '#222833');
        ctx.fillRect(0, 0, 1024, 1024);

        const pitchPx = 1024 / (w / this.gridPitch);
        ctx.fillStyle = holeColor;
        ctx.strokeStyle = holeStroke;
        ctx.lineWidth = 1.5;

        for (let x = pitchPx / 2; x < 1024; x += pitchPx) {
            for (let y = pitchPx / 2; y < 1024; y += pitchPx) {
                ctx.beginPath();
                ctx.arc(x, y, 3.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(x, y, 1.8, 0, Math.PI * 2);
                ctx.strokeStyle = isLight ? '#b0bac9' : '#141a24';
                ctx.stroke();
            }
        }

        const gridTexture = new THREE.CanvasTexture(gridCanvas);
        gridTexture.wrapS = THREE.RepeatWrapping;
        gridTexture.wrapT = THREE.RepeatWrapping;
        gridTexture.repeat.set(1, l / w);

        const surfaceGeo = new THREE.PlaneGeometry(w, l);
        surfaceGeo.rotateX(-Math.PI / 2);
        const surfaceMat = new THREE.MeshStandardMaterial({
            map: gridTexture,
            metalness: 0.75,
            roughness: 0.35
        });
        const surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
        surfaceMesh.position.y = 0.1;
        surfaceMesh.receiveShadow = true;
        this.tableGroup.add(surfaceMesh);

        // 4x Pneumatic Isolation Table Legs
        const legRadius = 55;
        const legH = 650;
        const legGeo = new THREE.CylinderGeometry(legRadius, legRadius, legH, 32);
        const legMat = new THREE.MeshStandardMaterial({
            color: isLight ? 0x778899 : 0x1a1e26,
            roughness: 0.4,
            metalness: 0.6
        });

        const legOffsets = [
            [-w / 2 + 90, -t - legH / 2, -l / 2 + 90],
            [w / 2 - 90, -t - legH / 2, -l / 2 + 90],
            [-w / 2 + 90, -t - legH / 2, l / 2 - 90],
            [w / 2 - 90, -t - legH / 2, l / 2 - 90]
        ];

        legOffsets.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(pos[0], pos[1], pos[2]);
            this.tableGroup.add(leg);
        });
    }

    /**
     * Adds an elevated bridge breadboard (Deck 1) or overhead rack (Deck 2) with customizable dimensions
     */
    addDeck(width = 450, length = 600, elevation = 200, name = "Elevated Deck") {
        const deckId = `deck_${Date.now()}`;
        const w = width;
        const l = length;
        const t = 35;

        const deckGroup = new THREE.Group();
        deckGroup.name = deckId;
        deckGroup.position.set(0, elevation, 0);

        const deckGeo = new THREE.BoxGeometry(w, t, l);
        const deckMat = new THREE.MeshStandardMaterial({
            color: this.currentTheme === "light" ? 0xd0d5dd : 0x2d3442,
            metalness: 0.8,
            roughness: 0.3
        });
        const deckMesh = new THREE.Mesh(deckGeo, deckMat);
        deckMesh.position.y = -t / 2;
        deckMesh.receiveShadow = true;
        deckGroup.add(deckMesh);

        // 4x Rigid Support Damping Posts down to main table
        const postGeo = new THREE.CylinderGeometry(18, 18, elevation, 24);
        const postMat = new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.9, roughness: 0.2 });

        const xOff = w / 2 - 35;
        const zOff = l / 2 - 35;
        const legPositions = [
            [-xOff, -elevation / 2, -zOff],
            [xOff, -elevation / 2, -zOff],
            [-xOff, -elevation / 2, zOff],
            [xOff, -elevation / 2, zOff]
        ];

        legPositions.forEach(p => {
            const leg = new THREE.Mesh(postGeo, postMat);
            leg.position.set(p[0], p[1], p[2]);
            deckGroup.add(leg);
        });

        this.decksGroup.add(deckGroup);

        const deckInfo = {
            id: deckId,
            name: name,
            width: w,
            length: l,
            elevation: elevation,
            group: deckGroup
        };

        this.placedDecks.push(deckInfo);
        return deckInfo;
    }

    removeDeck(deckId) {
        const deckIndex = this.placedDecks.findIndex(d => d.id === deckId);
        if (deckIndex === -1) return;

        const deck = this.placedDecks[deckIndex];
        this.decksGroup.remove(deck.group);
        deck.group.traverse(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
        });

        this.placedDecks.splice(deckIndex, 1);
    }

    /**
     * Auto-levels the selected component's height to match a reference standard:
     * - "beam" (100.0 mm)
     * - "olympus_side" (155.0 mm)
     * - "olympus_epi" (215.0 mm)
     * - "zeiss_imager" (350.0 mm)
     */
    autoLevelSelected(targetType = "beam") {
        if (!this.selectedComponent) return;

        let targetY = 100.0;
        if (targetType === "olympus_side") targetY = 155.0;
        else if (targetType === "olympus_epi") targetY = 215.0;
        else if (targetType === "zeiss_imager") targetY = 350.0;
        else if (targetType === "beam") {
            // Find current active beam height
            const laser = this.placedComponents.find(c => c.data.type === "laser_source");
            if (laser) targetY = laser.mesh.position.y;
        }

        this.selectedComponent.mesh.position.y = targetY;
        this.onComponentMoved(this.selectedComponent);
    }

    /**
     * Intelligent 4f conjugate lens recommendation:
     * If a lens of focal length f is placed, suggests placing the conjugate optic at 2f or f1+f2
     */
    suggestConjugatePair(comp) {
        if (!comp || comp.data.type !== "lens") return null;

        const f = comp.data.focal_length_mm || 100.0;
        // Direction of active beam or forward direction
        const dir = new THREE.Vector3(0, 0, 1).applyEuler(comp.mesh.rotation).normalize();
        const suggestedPos = comp.mesh.position.clone().addScaledVector(dir, f * 2.0);

        return {
            source_lens_f: f,
            distance_mm: f * 2.0,
            suggested_pos: suggestedPos,
            text: `4f Telecentric Conjugate: Place matched lens at +${(f * 2.0).toFixed(0)}mm (d = 2f)`
        };
    }

    /**
     * Dynamically updates a microscope's port configuration (e.g. Top Laser In vs Top Camera, Left Side Camera vs Spectrometer)
     * Rebuilds the 3D procedural mesh seamlessly while preserving table position, rotation, and ID.
     */
    updateMicroscopePortConfig(comp, newPortConfig) {
        if (!comp || comp.data.type !== "microscope_frame") return;
        comp.data.port_configuration = Object.assign({}, comp.data.port_configuration, newPortConfig);

        const pos = comp.mesh.position.clone();
        const rot = comp.mesh.rotation.clone();

        // Remove previous 3D mesh
        this.componentsGroup.remove(comp.mesh);
        comp.mesh.traverse(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) {
                if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                else c.material.dispose();
            }
        });

        // Rebuild updated procedural mesh
        let previewHelper = window.app && window.app.previewViewport;
        const newMesh = previewHelper ? previewHelper.buildProceduralModel(comp.data) : new THREE.Group();
        newMesh.name = comp.id;
        newMesh.position.copy(pos);
        newMesh.rotation.copy(rot);

        this.componentsGroup.add(newMesh);
        comp.mesh = newMesh;

        // Re-attach transform controls if selected
        if (this.selectedComponent && this.selectedComponent.id === comp.id) {
            this.transformControls.attach(comp.mesh);
        }

        // Trigger real-time optical beam recalculation
        if (window.app && window.app.raytracer) {
            window.app.raytracer.updateBeams();
        }
        this.updateInspectorFields(comp);
    }

    /**
     * Generates a standard optical label (e.g. M1, M2 for mirrors; L1, L2 for lenses)
     */
    generateComponentLabel(data) {
        let prefix = "OPT";
        const type = data.type || "";

        if (type === "mirror") prefix = "M";
        else if (type === "flip_mirror" || data.is_flip_mirror) prefix = "FM";
        else if (type === "lens") prefix = "L";
        else if (type === "beamsplitter_cube") prefix = "BS";
        else if (type === "dichroic_cube") prefix = "DM";
        else if (type === "confocal_pinhole") prefix = "PH";
        else if (type.startsWith("filter_")) prefix = "F";
        else if (type === "iris") prefix = "A";
        else if (type === "laser_source") prefix = "Laser";
        else if (type === "microscope_frame") prefix = "Scope";
        else if (type === "spectrometer") prefix = "Spec";
        else if (type === "camera") prefix = "Cam";
        else if (type.includes("periscope")) prefix = "Peri";

        let maxNum = 0;
        const regex = new RegExp(`^${prefix}\\s*(\\d+)$`);

        this.placedComponents.forEach(c => {
            const lbl = c.label || "";
            const match = lbl.match(regex);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
        });

        const nextNum = maxNum + 1;
        return (prefix === "Laser" || prefix === "Scope" || prefix === "Spec" || prefix === "Cam" || prefix === "Peri")
            ? `${prefix} ${nextNum}`
            : `${prefix}${nextNum}`;
    }

    drawRoundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    getLabelColor(type) {
        if (type === "mirror") return "#00d2ff"; // Cyan for mirrors
        if (type === "flip_mirror") return "#ffaa00"; // Amber for flip mirrors
        if (type === "lens") return "#10b981"; // Emerald green for lenses
        if (type === "beamsplitter_cube" || type === "dichroic_cube") return "#a855f7"; // Purple for beamsplitters
        if (type && type.startsWith("filter_")) return "#f59e0b"; // Gold for filters
        if (type === "confocal_pinhole") return "#38bdf8"; // Sky blue
        if (type === "laser_source") return "#00ff41"; // Laser green
        if (type === "microscope_frame") return "#0070ba"; // Zeiss blue
        if (type === "spectrometer" || type === "camera") return "#ec4899"; // Pink
        return "#3b82f6";
    }

    createLabelSprite(text, type = "mirror") {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        const strokeColor = this.getLabelColor(type);

        // Pill / badge background
        ctx.fillStyle = "rgba(10, 15, 24, 0.90)";
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 6;
        this.drawRoundRect(ctx, 16, 20, 224, 88, 28);
        ctx.fill();
        ctx.stroke();

        // Label text
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 54px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 128, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            depthTest: false,
            transparent: true
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.renderOrder = 999;
        sprite.scale.set(38, 19, 1);
        return sprite;
    }

    updateComponentLabel(comp, newLabel) {
        if (!comp || !newLabel) return;
        comp.label = newLabel.trim().toUpperCase();

        if (comp.label_sprite && comp.label_sprite.material && comp.label_sprite.material.map) {
            const canvas = comp.label_sprite.material.map.image;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const strokeColor = this.getLabelColor(comp.data.type);
                ctx.fillStyle = "rgba(10, 15, 24, 0.90)";
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 6;
                this.drawRoundRect(ctx, 16, 20, 224, 88, 28);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = "#ffffff";
                ctx.font = "900 54px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(comp.label, 128, 64);

                comp.label_sprite.material.map.needsUpdate = true;
            }
        }

        const badgeEl = document.getElementById("insp-label-badge");
        if (badgeEl) badgeEl.innerText = comp.label;

        if (window.app && window.app.updateTargetOpticDropdown) {
            window.app.updateTargetOpticDropdown();
        }
    }

    toggleLabels(show = null) {
        this.showLabels = (show !== null) ? show : !this.showLabels;
        this.placedComponents.forEach(c => {
            if (c.label_sprite) c.label_sprite.visible = this.showLabels;
        });
        return this.showLabels;
    }

    /**
     * Adds a new component positioned along the exit optical beam path of sourceComp
     * ('Add after M1' / 'Add after L1' with perpendicular or horizontal path options)
     * @param {Object} sourceComp - Reference component (e.g. M1)
     * @param {string} catalogId - Catalog item ID to insert (e.g. 'LMR1-AC50')
     * @param {Object} options - { branch: 'perpendicular'|'straight'|'primary', distance: number }
     */
    addComponentAfter(sourceComp, catalogId, options = {}) {
        if (!sourceComp) return null;

        const branch = options.branch || "primary";
        const dist = options.distance !== undefined ? options.distance : 125.0;

        let exitBeam = null;
        if (window.app && window.app.raytracer) {
            exitBeam = window.app.raytracer.getExitBeam(sourceComp, branch);
        }

        if (!exitBeam) {
            // Fallback: project forward from source
            const fwd = new THREE.Vector3(0, 0, 1).applyEuler(sourceComp.mesh.rotation).normalize();
            exitBeam = { startPoint: sourceComp.mesh.position.clone(), direction: fwd, isReflected: false };
        }

        const newPos = exitBeam.startPoint.clone().addScaledVector(exitBeam.direction, dist);
        // Maintain source component's optical elevation
        newPos.y = sourceComp.mesh.position.y;

        // Calculate rotation facing into the incoming beam
        const v = exitBeam.direction.clone();
        let rotDeg = THREE.MathUtils.radToDeg(Math.atan2(v.x, v.z));

        const targetData = window.COMPONENT_CATALOG[catalogId];
        if (targetData) {
            const tType = targetData.type;
            if (tType === "mirror" || tType === "flip_mirror" || targetData.is_flip_mirror) {
                // 45° fold mirror to deflect beam by another 90 degrees
                rotDeg -= 45.0;
            }
        }

        const newComp = this.addComponent(catalogId, newPos, rotDeg);
        if (newComp && sourceComp.deck_level) {
            newComp.deck_level = sourceComp.deck_level;
        }

        return newComp;
    }

    /**
     * Rebuilds the 3D procedural mesh representation of a component
     * (Called when elevation, mounts, state, or parameters are altered)
     */
    rebuildComponentMesh(comp) {
        if (!comp || !comp.mesh) return;

        const pos = comp.mesh.position.clone();
        const rot = comp.mesh.rotation.clone();

        // Preserve optic_head pitch/tilt if present
        let headRot = null;
        const oldHead = comp.mesh.getObjectByName("optic_head");
        if (oldHead) {
            headRot = oldHead.rotation.clone();
        }

        this.componentsGroup.remove(comp.mesh);
        comp.mesh.traverse(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) {
                if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                else c.material.dispose();
            }
        });

        let previewHelper = window.app && window.app.previewViewport;
        const newMesh = previewHelper ? previewHelper.buildProceduralModel(comp.data) : new THREE.Group();
        newMesh.name = comp.id;
        newMesh.position.copy(pos);
        newMesh.rotation.copy(rot);

        if (headRot) {
            const newHead = newMesh.getObjectByName("optic_head");
            if (newHead) newHead.rotation.copy(headRot);
        }

        // Re-attach label sprite
        const sprite = this.createLabelSprite(comp.label || "OPT", comp.data.type);
        sprite.visible = this.showLabels;
        let labelY = 40;
        if (comp.data.type === "microscope_frame") {
            labelY = 285;
        } else if (comp.data.dimensions && comp.data.dimensions.height) {
            labelY = (comp.data.dimensions.height / 2) + 16;
        }
        sprite.position.set(0, labelY, 0);
        newMesh.add(sprite);
        comp.label_sprite = sprite;

        this.componentsGroup.add(newMesh);
        comp.mesh = newMesh;

        this.applyComponentMountVisibility(comp);

        if (this.selectedComponent && this.selectedComponent.id === comp.id) {
            if (this.transformControls) this.transformControls.attach(comp.mesh);
        }

        if (window.app && window.app.raytracer) {
            window.app.raytracer.updateBeams();
        }
        this.updateInspectorFields(comp);
    }

    /**
     * Toggles flip mirror state ('engaged' vs 'bypassed')
     */
    toggleFlipMirrorState(comp, newState = null) {
        if (!comp || (!comp.data.is_flip_mirror && comp.data.type !== "flip_mirror")) return;

        const current = comp.data.flip_state || "engaged";
        comp.data.flip_state = newState || (current === "engaged" ? "bypassed" : "engaged");
        this.rebuildComponentMesh(comp);
    }

    /**
     * Updates periscope elevation height (delta Y in mm) and updates 3D mesh
     */
    updatePeriscopeElevation(comp, newDelta) {
        if (!comp) return;
        comp.data.elevation_delta_mm = parseFloat(newDelta) || 100;
        this.rebuildComponentMesh(comp);
    }

    /**
     * Toggles/sets periscope overhead 30mm cage arm bridge
     */
    updatePeriscopeOverheadArm(comp, hasArm, armLength = 195) {
        if (!comp) return;
        comp.data.has_overhead_arm = !!hasArm;
        comp.data.overhead_arm_length_mm = parseFloat(armLength) || 195;
        this.rebuildComponentMesh(comp);
    }

    /**
     * Global Mounts Visibility Toggle ('Mounts ON' vs 'Optics Only')
     */
    setGlobalMountsVisibility(visible) {
        this.globalMountsVisible = !!visible;
        for (const comp of this.placedComponents) {
            this.applyComponentMountVisibility(comp);
        }
    }

    /**
     * Swaps the insert inside a 30mm cube base (dichroic / 50:50 / PBS)
     */
    setCubeInsert(comp, insertKey) {
        const lib = window.CUBE_INSERT_LIBRARY && window.CUBE_INSERT_LIBRARY[insertKey];
        if (!comp || !lib) return;
        if (comp.data.type !== "dichroic_cube" && comp.data.type !== "beamsplitter_cube") return;

        comp.data.cube_insert_id = insertKey;
        comp.data.type = lib.type;
        comp.data.part_no = lib.part_no;
        comp.data.vendor = lib.vendor;
        comp.data.name = lib.type === "dichroic_cube" ? `${lib.label} Cube` : lib.label;
        comp.data.description = lib.description;
        if (lib.type === "dichroic_cube") {
            comp.data.cut_on_wavelength_nm = lib.cut_on_wavelength_nm;
            comp.data.dichroic_mode = lib.dichroic_mode;
            delete comp.data.split_ratio;
        } else {
            comp.data.split_ratio = lib.split_ratio;
            delete comp.data.cut_on_wavelength_nm;
            delete comp.data.dichroic_mode;
        }
        this.rebuildComponentMesh(comp);
    }

    /**
     * Moves a component between the main table (level 0) and an elevated deck.
     * levelIndex: -1 = table, otherwise index in placedDecks.
     */
    setComponentLevel(comp, levelIndex) {
        if (!comp || comp.data.type === "microscope_frame") return;
        const idx = parseInt(levelIndex, 10);
        const deck = idx >= 0 ? this.placedDecks[idx] : null;
        const elev = deck ? deck.elevation : 0;
        comp.data.level_elevation_mm = elev;
        comp.data.default_height_mm = 100.0; // optical axis is 100 mm above the surface it stands on
        comp.mesh.position.y = elev + 100.0;
        this.rebuildComponentMesh(comp);
        this.onComponentMoved(comp);
    }

    toggleMountsVisibility() {
        this.setGlobalMountsVisibility(!this.globalMountsVisible);
        return this.globalMountsVisible;
    }

    /**
     * Per-Component Mount Visibility Toggle
     */
    setComponentMountVisibility(comp, visible) {
        if (!comp) return;
        comp.data.show_mount = !!visible;
        this.applyComponentMountVisibility(comp);
    }

    /**
     * Applies visibility state to mechanical posts, post holders, bases, and cage rods
     * while preserving optical glass elements, mirror surfaces, and laser beams
     */
    applyComponentMountVisibility(comp) {
        if (!comp || !comp.mesh) return;
        const shouldShow = this.globalMountsVisible && (comp.data.show_mount !== false);

        comp.mesh.traverse((child) => {
            // Optical elements and laser beams are NEVER hidden by mount toggle
            if (child.userData && child.userData.isOptic) {
                child.visible = true;
                return;
            }
            // Label billboard sprites are controlled by showLabels
            if (child.isSprite || child.name === "label_sprite") {
                child.visible = this.showLabels;
                return;
            }
            // Axis lines
            if (child.userData && child.userData.isAxis) {
                return;
            }

            // Mechanical mounts, post holders, base plates, cage rods, clamping hardware
            if (child.userData && child.userData.isMount) {
                child.visible = shouldShow;
            } else if (child.name && (child.name.startsWith("mount_") || child.name === "mount_hardware" || child.name === "mount_post_stack")) {
                child.visible = shouldShow;
            }
        });
    }

    /**
     * Instantiates a component on the table with Smart Ray-Snapping and optional overrides
     */
    addComponent(catalogId, position = null, rotationDeg = 0, initialDataOverrides = null) {
        const data = window.COMPONENT_CATALOG[catalogId];
        if (!data) {
            console.error(`Component ID ${catalogId} not found in catalog.`);
            return null;
        }

        let previewHelper = window.app && window.app.previewViewport;
        let meshGroup;

        // Grounding: compute effective optical height so post stack connects to table
        const customHeight = (position && position.y !== undefined) ? position.y : (data.default_height_mm || 100);
        const mergedData = Object.assign({}, JSON.parse(JSON.stringify(data)), { default_height_mm: customHeight }, initialDataOverrides || {});

        if (previewHelper) {
            meshGroup = previewHelper.buildProceduralModel(mergedData);
        } else {
            meshGroup = new THREE.Group();
            const box = new THREE.Mesh(new THREE.BoxGeometry(40, 40, 40), new THREE.MeshStandardMaterial({ color: 0x333333 }));
            meshGroup.add(box);
        }

        const compId = `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        meshGroup.name = compId;

        const defaultY = mergedData.type === "microscope_frame" ? 0 : (mergedData.default_height_mm || 100);

        if (position) {
            meshGroup.position.set(position.x, position.y !== undefined ? position.y : defaultY, position.z);
        } else {
            // Smart Ray-Snap: Snap onto active laser path if available
            let snappedToBeam = false;
            if (this.snapToRay && mergedData.type !== "laser_source" && window.app && window.app.raytracer) {
                const laser = this.placedComponents.find(c => c.data.type === "laser_source");
                if (laser) {
                    const lPos = laser.mesh.position;
                    // Place 150mm forward along laser axis
                    const lDir = new THREE.Vector3(0, 0, 1).applyEuler(laser.mesh.rotation).normalize();
                    const existingCount = this.placedComponents.length;
                    const snapPos = lPos.clone().addScaledVector(lDir, existingCount * 120);

                    meshGroup.position.set(snapPos.x, defaultY, snapPos.z);
                    snappedToBeam = true;
                }
            }

            if (!snappedToBeam) {
                const index = this.placedComponents.length;
                const x = (index % 5 - 2) * 125;
                const z = (Math.floor(index / 5) - 1) * 150;
                meshGroup.position.set(x, defaultY, z);
            }
        }

        if (rotationDeg !== null && rotationDeg !== undefined) {
            if (typeof rotationDeg === "number") {
                meshGroup.rotation.y = THREE.MathUtils.degToRad(rotationDeg);
            } else if (typeof rotationDeg === "object") {
                const opticHead = meshGroup.getObjectByName("optic_head");
                if (opticHead && (rotationDeg.x !== undefined || rotationDeg.z !== undefined)) {
                    // Tilt the mirror head only (keeps post holder & base plate 100% vertical on table!)
                    if (rotationDeg.x !== undefined) opticHead.rotation.x = THREE.MathUtils.degToRad(rotationDeg.x);
                    if (rotationDeg.z !== undefined) opticHead.rotation.z = THREE.MathUtils.degToRad(rotationDeg.z);
                    if (rotationDeg.y !== undefined) meshGroup.rotation.y = THREE.MathUtils.degToRad(rotationDeg.y);
                } else {
                    if (rotationDeg.y !== undefined) meshGroup.rotation.y = THREE.MathUtils.degToRad(rotationDeg.y);
                    if (rotationDeg.x !== undefined) meshGroup.rotation.x = THREE.MathUtils.degToRad(rotationDeg.x);
                    if (rotationDeg.z !== undefined) meshGroup.rotation.z = THREE.MathUtils.degToRad(rotationDeg.z);
                }
            }
        }

        // Automatic Optical Component Label (M1, L1, etc.) & 3D Billboard Sprite
        const autoLabel = this.generateComponentLabel(mergedData);
        const labelSprite = this.createLabelSprite(autoLabel, mergedData.type);
        labelSprite.visible = this.showLabels;

        let labelY = 40;
        if (mergedData.type === "microscope_frame") {
            labelY = 285;
        } else if (mergedData.dimensions && mergedData.dimensions.height) {
            labelY = (mergedData.dimensions.height / 2) + 16;
        }
        labelSprite.position.set(0, labelY, 0);
        meshGroup.add(labelSprite);

        this.componentsGroup.add(meshGroup);

        const compInstance = {
            id: compId,
            catalog_id: catalogId,
            label: autoLabel,
            label_sprite: labelSprite,
            mesh: meshGroup,
            data: mergedData,
            deck_level: this.activeDeckLevel
        };

        this.placedComponents.push(compInstance);
        this.applyComponentMountVisibility(compInstance);
        this.selectComponent(compInstance);

        if (window.app && window.app.raytracer) {
            window.app.raytracer.updateBeams();
        }
        if (window.app) {
            window.app.updateStatusTelemetry();
            if (window.app.updateTargetOpticDropdown) {
                window.app.updateTargetOpticDropdown();
            }
        }

        return compInstance;
    }

    selectComponent(compInstance) {
        if (!compInstance) {
            this.selectedComponent = null;
            if (this.transformControls) this.transformControls.detach();
            this.updateInspectorFields(null);
            return;
        }

        this.selectedComponent = compInstance;
        if (this.transformControls) {
            this.transformControls.attach(compInstance.mesh);
        }

        this.updateInspectorFields(compInstance);
    }

    onPointerDown(event) {
        if (this.transformControls && this.transformControls.dragging) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.componentsGroup.children, true);

        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj.parent && obj.parent !== this.componentsGroup) {
                obj = obj.parent;
            }
            const comp = this.placedComponents.find(c => c.id === obj.name);
            if (comp) {
                this.selectComponent(comp);
            }
        }
    }

    onComponentMoved(comp) {
        if (!comp) return;

        if (this.snapToGrid) {
            const pitch = this.gridPitch;
            comp.mesh.position.x = Math.round(comp.mesh.position.x / pitch) * pitch;
            comp.mesh.position.z = Math.round(comp.mesh.position.z / pitch) * pitch;
        }

        this.updateInspectorFields(comp);
        if (window.app && window.app.raytracer) {
            window.app.raytracer.updateBeams();
        }
        if (window.app) {
            window.app.updateStatusTelemetry();
        }
    }

    deleteSelectedComponent() {
        if (!this.selectedComponent) return;

        const comp = this.selectedComponent;
        this.componentsGroup.remove(comp.mesh);
        comp.mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
        });

        this.placedComponents = this.placedComponents.filter(c => c.id !== comp.id);
        this.selectComponent(null);

        if (window.app && window.app.raytracer) {
            window.app.raytracer.updateBeams();
        }
        if (window.app) {
            window.app.updateStatusTelemetry();
        }
    }

    updateInspectorFields(comp) {
        const inspector = document.getElementById("active-inspector-panel");
        const noSelMsg = document.getElementById("no-selection-message");
        if (!inspector || !noSelMsg) return;

        if (!comp) {
            inspector.style.display = "none";
            noSelMsg.style.display = "block";
            return;
        }

        inspector.style.display = "block";
        noSelMsg.style.display = "none";

        const nameEl = document.getElementById("insp-name");
        const partEl = document.getElementById("insp-part");
        const labelBadge = document.getElementById("insp-label-badge");
        const customLabelInput = document.getElementById("insp-custom-label");
        const typeBadge = document.getElementById("insp-type-badge");
        const posX = document.getElementById("insp-pos-x");
        const posY = document.getElementById("insp-pos-y");
        const posZ = document.getElementById("insp-pos-z");
        const rotY = document.getElementById("insp-rot-y");

        if (nameEl) nameEl.innerText = comp.data.name;
        if (partEl) partEl.innerText = comp.data.part_no || comp.catalog_id;
        if (labelBadge) labelBadge.innerText = comp.label || "OPT";
        if (customLabelInput) customLabelInput.value = comp.label || "";
        if (typeBadge) typeBadge.innerText = comp.data.category || comp.data.type;

        if (posX) posX.value = comp.mesh.position.x.toFixed(1);
        if (posY) posY.value = comp.mesh.position.y.toFixed(1);
        if (posZ) posZ.value = comp.mesh.position.z.toFixed(1);
        if (rotY) rotY.value = Math.round(THREE.MathUtils.radToDeg(comp.mesh.rotation.y)) % 360;

        // Mount Visibility Toggle for Selected Component
        const showMountCheck = document.getElementById("insp-show-mount");
        const mountLabel = document.getElementById("insp-mount-label");
        if (showMountCheck) {
            const isMntVis = comp.data.show_mount !== false;
            showMountCheck.checked = isMntVis;
            if (mountLabel) mountLabel.innerText = isMntVis ? "Visible" : "Hidden";
        }

        // Periscope Controls (Thorlabs C4W Cage / RS99)
        const periControlsEl = document.getElementById("insp-periscope-controls");
        if (periControlsEl) {
            const isPeri = comp.data.is_periscope || comp.data.type === "cage_periscope" || comp.data.type === "periscope";
            if (isPeri) {
                periControlsEl.style.display = "block";
                const periElevBadge = document.getElementById("insp-peri-elev-badge");
                const periElevInput = document.getElementById("insp-peri-elevation");
                const periArmCheck = document.getElementById("insp-peri-overhead-arm");
                const deltaY = comp.data.elevation_delta_mm || 150;
                if (periElevBadge) periElevBadge.innerText = `ΔY: ${deltaY}mm`;
                if (periElevInput) periElevInput.value = deltaY;
                if (periArmCheck) periArmCheck.checked = !!(comp.data.has_overhead_arm || comp.data.overhead_arm_length_mm);
            } else {
                periControlsEl.style.display = "none";
            }
        }

        // Cube base insert selector (dichroic / BS cubes)
        const cubeControlsEl = document.getElementById("insp-cube-controls");
        if (cubeControlsEl) {
            const isCube = comp.data.type === "dichroic_cube" || comp.data.type === "beamsplitter_cube";
            if (isCube && window.CUBE_INSERT_LIBRARY) {
                cubeControlsEl.style.display = "block";
                const sel = document.getElementById("insp-cube-insert");
                if (sel && sel.options.length === 0) {
                    Object.keys(window.CUBE_INSERT_LIBRARY).forEach(k => {
                        const o = document.createElement("option");
                        o.value = k;
                        o.textContent = window.CUBE_INSERT_LIBRARY[k].label;
                        sel.appendChild(o);
                    });
                }
                if (sel) sel.value = comp.data.cube_insert_id || "DM-R532";

                const statusEl = document.getElementById("insp-cube-status");
                if (statusEl) {
                    const laser = this.placedComponents.find(c => c.data.type === "laser_source");
                    const wl = laser ? (laser.data.wavelength_nm || 532) : null;
                    if (comp.data.type === "dichroic_cube") {
                        const mode = comp.data.dichroic_mode || "longpass";
                        const cut = comp.data.cut_on_wavelength_nm;
                        let txt = `${mode === "longpass" ? "Longpass" : "Shortpass"} dichroic, cut ${mode === "longpass" ? "on" : "off"} ${cut} nm.`;
                        if (wl !== null && window.app && window.app.raytracer) {
                            const refl = window.app.raytracer.dichroicReflects(comp, wl);
                            txt += refl ? ` Laser ${wl} nm: REFLECTED ✓` : ` Laser ${wl} nm: TRANSMITTED ✗ (choose another insert)`;
                        }
                        statusEl.textContent = txt;
                    } else {
                        statusEl.textContent = `Beamsplitter insert (${comp.data.split_ratio}).`;
                    }
                }
            } else {
                cubeControlsEl.style.display = "none";
            }
        }

        // Mount level selector (table / elevated decks)
        const levelSel = document.getElementById("insp-level-select");
        if (levelSel) {
            const isScope = comp.data.type === "microscope_frame";
            levelSel.parentElement.style.display = isScope ? "none" : "flex";
            levelSel.innerHTML = "";
            const optT = document.createElement("option");
            optT.value = "-1";
            optT.textContent = "Level 1: Optical Table";
            levelSel.appendChild(optT);
            this.placedDecks.forEach((d, i) => {
                const o = document.createElement("option");
                o.value = String(i);
                o.textContent = `Level ${i + 2}: ${d.name} (+${d.elevation} mm)`;
                levelSel.appendChild(o);
            });
            const curElev = comp.data.level_elevation_mm || 0;
            const match = this.placedDecks.findIndex(d => d.elevation === curElev);
            levelSel.value = curElev > 0 && match >= 0 ? String(match) : "-1";
        }

        // Flip Mirror Mount Controls (Thorlabs TRF90)
        const flipControlsEl = document.getElementById("insp-flip-mirror-controls");
        const flipStateBadge = document.getElementById("insp-flip-state-badge");
        const btnFlipEngaged = document.getElementById("btn-flip-engaged");
        const btnFlipBypassed = document.getElementById("btn-flip-bypassed");

        if (flipControlsEl) {
            const isFlip = comp.data.is_flip_mirror || comp.data.type === "flip_mirror";
            if (isFlip) {
                flipControlsEl.style.display = "block";
                const isBypassed = comp.data.flip_state === "bypassed";
                if (flipStateBadge) {
                    flipStateBadge.innerText = isBypassed ? "Bypassed (Straight)" : "Engaged (90°)";
                    flipStateBadge.style.color = isBypassed ? "#10b981" : "#ffcc00";
                }
                if (btnFlipEngaged) btnFlipEngaged.className = isBypassed ? "btn-tool btn-secondary" : "btn-tool btn-primary";
                if (btnFlipBypassed) btnFlipBypassed.className = isBypassed ? "btn-tool btn-primary" : "btn-tool btn-secondary";
            } else {
                flipControlsEl.style.display = "none";
            }
        }

        // Post Math & Grounding validation
        const postMathEl = document.getElementById("insp-postmath-status");
        if (postMathEl) {
            const h = comp.mesh.position.y;
            if (comp.data.post_stack) {
                postMathEl.innerHTML = `Optical Axis Height: <strong>${h.toFixed(1)} mm</strong><br><small>Stack: ${comp.data.post_stack.base} + ${comp.data.post_stack.post_holder || 'Direct'} + ${comp.data.post_stack.post || 'None'}</small>`;
            } else {
                postMathEl.innerHTML = `Optical Axis Height: <strong>${h.toFixed(1)} mm</strong><br><small>Base: Direct Table Footprint</small>`;
            }
        }

        // 4f Conjugate Lens Suggestion Box
        const conjEl = document.getElementById("insp-conjugate-suggestion");
        if (conjEl) {
            const conj = this.suggestConjugatePair(comp);
            if (conj) {
                conjEl.style.display = "block";
                conjEl.innerHTML = `💡 <strong>${conj.text}</strong>`;
            } else {
                conjEl.style.display = "none";
            }
        }

        // Microscope Port Routing Section (Olympus / Zeiss)
        const microPortsEl = document.getElementById("insp-microscope-ports");
        if (microPortsEl) {
            if (comp.data.type === "microscope_frame") {
                microPortsEl.style.display = "block";
                const portConfig = comp.data.port_configuration || { top_port: "laser_in", left_port: "camera" };
                const topSelect = document.getElementById("insp-top-port");
                const leftSelect = document.getElementById("insp-left-port");
                const retroSelect = document.getElementById("insp-retro-route");
                if (topSelect) topSelect.value = portConfig.top_port || "laser_in";
                if (leftSelect) leftSelect.value = portConfig.left_port || "camera";
                if (retroSelect) retroSelect.value = comp.data.retro_route || portConfig.retro_route || "retro_dm";
            } else {
                microPortsEl.style.display = "none";
            }
        }

        if (window.app && window.app.updateTargetOpticDropdown) {
            window.app.updateTargetOpticDropdown(comp.id);
        }
    }

    setCameraPreset(preset) {
        if (!this.camera || !this.orbitControls) return;

        switch (preset) {
            case 'iso':
                this.camera.position.set(650, 750, 950);
                this.orbitControls.target.set(0, 100, 0);
                break;
            case 'top':
                this.camera.position.set(0, 1600, 0);
                this.orbitControls.target.set(0, 0, 0);
                break;
            case 'front':
                this.camera.position.set(0, 150, 1400);
                this.orbitControls.target.set(0, 100, 0);
                break;
            case 'side':
                this.camera.position.set(1400, 150, 0);
                this.orbitControls.target.set(0, 100, 0);
                break;
        }
        this.orbitControls.update();
    }

    setTransformMode(mode) {
        if (this.transformControls) {
            this.transformControls.setMode(mode);
        }
    }

    /**
     * High-Resolution Image Export (.png)
     */
    exportScreenshot() {
        if (!this.renderer) return;

        // Render clean frame
        this.renderer.render(this.scene, this.camera);
        const dataURL = this.renderer.domElement.toDataURL("image/png");

        const link = document.createElement("a");
        link.download = `OptiPath3D_Optical_Layout_${Date.now()}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * 3D Scene JSON Layout Export
     */
    export3DSceneJSON() {
        const layout = {
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            theme: this.currentTheme,
            table: this.tableDimensions,
            decks: this.placedDecks.map(d => ({
                id: d.id,
                name: d.name,
                width: d.width,
                length: d.length,
                elevation: d.elevation
            })),
            components: this.placedComponents.map(c => ({
                id: c.id,
                catalog_id: c.catalog_id,
                name: c.data.name,
                position: [c.mesh.position.x, c.mesh.position.y, c.mesh.position.z],
                rotation_deg: [
                    THREE.MathUtils.radToDeg(c.mesh.rotation.x),
                    THREE.MathUtils.radToDeg(c.mesh.rotation.y),
                    THREE.MathUtils.radToDeg(c.mesh.rotation.z)
                ]
            }))
        };

        const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(layout, null, 2));
        const link = document.createElement("a");
        link.download = `OptiPath3D_Scene_${Date.now()}.json`;
        link.href = jsonStr;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    onResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width === 0 || height === 0) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(this.animate);

        if (this.orbitControls) {
            this.orbitControls.update();
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

window.OpticalBenchScene = OpticalBenchScene;
